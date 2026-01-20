'use client'

export interface OfflineAction {
  id: string
  type: 'create_invoice' | 'update_invoice' | 'send_invoice' | 'send_reminder'
  data: Record<string, unknown>
  timestamp: number
  retries: number
}

const DB_NAME = 'syntyx-offline'
const DB_VERSION = 1
const STORE_NAME = 'actions'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

export async function queueAction(
  action: Omit<OfflineAction, 'id' | 'timestamp' | 'retries'>
): Promise<string> {
  const db = await openDB()
  const id = crypto.randomUUID()

  const fullAction: OfflineAction = {
    ...action,
    id,
    timestamp: Date.now(),
    retries: 0
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.add(fullAction)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(id)

    transaction.oncomplete = () => db.close()
  })
}

export async function getPendingActions(): Promise<OfflineAction[]> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])

    transaction.oncomplete = () => db.close()
  })
}

export async function removeAction(id: string): Promise<void> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()

    transaction.oncomplete = () => db.close()
  })
}

export async function updateActionRetries(id: string, retries: number): Promise<void> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const getRequest = store.get(id)

    getRequest.onsuccess = () => {
      const action = getRequest.result as OfflineAction | undefined
      if (action) {
        action.retries = retries
        const updateRequest = store.put(action)
        updateRequest.onerror = () => reject(updateRequest.error)
        updateRequest.onsuccess = () => resolve()
      } else {
        resolve()
      }
    }

    getRequest.onerror = () => reject(getRequest.error)
    transaction.oncomplete = () => db.close()
  })
}

export async function processQueue(): Promise<{ success: number; failed: number }> {
  const actions = await getPendingActions()
  let success = 0
  let failed = 0

  for (const action of actions) {
    try {
      let endpoint = ''
      let method = 'POST'

      switch (action.type) {
        case 'create_invoice':
          endpoint = '/api/invoices'
          break
        case 'update_invoice':
          endpoint = `/api/invoices/${action.data.id}`
          method = 'PATCH'
          break
        case 'send_invoice':
          endpoint = '/api/email/send-invoice'
          break
        case 'send_reminder':
          endpoint = '/api/email/send-reminder'
          break
        default:
          console.warn('Unknown action type:', action.type)
          continue
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.data)
      })

      if (response.ok) {
        await removeAction(action.id)
        success++
      } else {
        // Increment retries if failed
        await updateActionRetries(action.id, action.retries + 1)
        failed++
      }
    } catch (error) {
      console.error('Failed to process action:', action.id, error)
      await updateActionRetries(action.id, action.retries + 1)
      failed++
    }
  }

  return { success, failed }
}

export async function getPendingCount(): Promise<number> {
  const actions = await getPendingActions()
  return actions.length
}

// Process queue when online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    processQueue().then(({ success, failed }) => {
      if (success > 0 || failed > 0) {
        console.log(`Offline queue processed: ${success} success, ${failed} failed`)
      }
    })
  })
}
