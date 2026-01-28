export const invoiceSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    customer: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: { type: 'string', description: 'Customer name' },
        emails: {
          type: 'array',
          items: { type: 'string' },
          description: 'Customer email addresses'
        },
        address: {
          anyOf: [{ type: 'string' }, { type: 'null' }],
          description: 'Customer address if mentioned'
        }
      },
      required: ['name', 'emails', 'address']
    },
    invoice: {
      type: 'object',
      additionalProperties: false,
      properties: {
        invoice_date: { type: 'string', description: 'Invoice date in YYYY-MM-DD format' },
        due_date: { type: 'string', description: 'Due date in YYYY-MM-DD format' },
        job_address: {
          anyOf: [{ type: 'string' }, { type: 'null' }],
          description: 'Job site address'
        },
        gst_enabled: { type: 'boolean', description: 'Whether GST applies' }
      },
      required: ['invoice_date', 'due_date', 'job_address', 'gst_enabled']
    },
    line_items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          description: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string', enum: ['hr', 'ea', 'm', 'm2', 'm3', 'kg', 'l'] },
          unit_price: {
            anyOf: [{ type: 'number' }, { type: 'null' }],
            description: 'Price per unit - null if not stated'
          },
          item_type: {
            type: 'string',
            enum: ['labour', 'material'],
            description: 'Whether this is a labour or material line item'
          }
        },
        required: ['description', 'quantity', 'unit', 'unit_price', 'item_type']
      }
    },
    notes: {
      anyOf: [{ type: 'string' }, { type: 'null' }]
    },
    changes_summary: { type: 'array', items: { type: 'string' } }
  },
  required: ['customer', 'invoice', 'line_items', 'notes', 'changes_summary']
}

export type InvoiceDraft = {
  customer: {
    name: string
    emails: string[]
    address?: string | null
    abn?: string | null
  }
  invoice: {
    invoice_number?: string
    invoice_date: string
    due_date: string
    job_address?: string | null
    gst_enabled: boolean
    prices_include_gst?: boolean
  }
  line_items: {
    description: string
    quantity: number
    unit: 'hr' | 'ea' | 'm' | 'm2' | 'm3' | 'kg' | 'l'
    unit_price: number | null
    item_type: 'labour' | 'material'
  }[]
  notes: string | null
  changes_summary: string[]
}
