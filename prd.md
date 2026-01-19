
# 📄 Product Requirements Document (PRD)

## Product: **Syntyx Invoices**

## Company: **Syntyx Labs**

## Version: **v1 + v1.5 (MVP)**

## Status: **Scope locked**

---

## 1. Product Overview

### 1.1 Problem Statement

Australian tradies lose unpaid time after work:

* remembering job details
* manually creating invoices
* sending invoices late
* awkwardly chasing payments

Existing tools are:

* slow on mobile
* form-heavy
* overbuilt (accounting, jobs, payroll)

This results in:

* delayed payments
* undercharging
* admin fatigue

---

### 1.2 Product Vision

Create the **fastest, lowest-mental-load way** for a tradie to send a correct invoice from their phone.

> **Talk → draft → adjust → send → stop chasing**

Key principles:

* AI assists, never decides
* Nothing auto-sends
* Human is always in control

---

## 2. Target Users

### Primary

* Australian tradies (electricians, plumbers, builders, HVAC)
* Sole traders or small teams (1–10)
* Mobile-first
* Currently invoicing via Word, Excel, Xero, handwritten notes

### Secondary (future)

* Clinics
* Contractors
* Other service businesses

---

## 3. Core Use Cases

1. Tradie finishes a job and wants to invoice immediately
2. Tradie remembers details imperfectly
3. Tradie wants to attach proof photos
4. Tradie wants to quickly tweak prices/quantities
5. Tradie wants reminders sent without awkward follow-ups
6. Tradie wants visibility in a dashboard

---

## 4. Feature Scope

---

## 4.1 Invoice Creation (Core)

### Inputs (can be combined)

* 🎙️ **Voice note**
* ⌨️ **Manual text input**
* 📸 **Optional photo attachments**

There is no required order.

---

### AI Drafting

* Voice is transcribed to text
* AI converts input into a **draft invoice**
* Output is **structured JSON only**
* AI suggestions are never final

AI may suggest:

* job description
* line items
* quantities/hours *only if stated*

AI must **not**:

* auto-send invoices
* lock prices
* override manual edits silently

---

## 4.2 Editable Invoice Preview (Critical)

The draft screen is a **fully editable invoice form**, not a static preview.

### Editable Header

* Customer name
* Customer email(s) (multiple allowed)
* Job address (optional)
* Invoice date
* Due date
* Invoice number (auto-generated, editable later)

---

### Editable Line Items Table

Each line item includes:

* Description (text)
* Quantity (number)
* Unit (optional: hr / ea / m)
* Unit price (number)
* GST toggle (invoice-level initially)

Totals update **live** as numbers change:

* Subtotal
* GST amount
* Total

Manual edits apply instantly and do **not** require AI.

---

## 4.3 AI Correction Input (Hybrid: Text OR Voice)

Alongside the editable preview, the user can request changes using **either text or voice**.

### UI

Label:

> **“Tell us what to change (optional)”**

Controls:

* Text input
* 🎙️ Microphone button
* **Apply changes** button

Voice input:

* is transcribed
* fills the same correction text field
* is editable before applying

---

### Example Corrections

* “Change labour to 2.5 hours”
* “Remove callout fee”
* “Customer supplied fittings”
* “Add 10m cable”
* “Change customer name to John Smith”
* “Split labour into install and testing”

---

### Behaviour

* AI runs **only** when user clicks **Apply changes**
* AI receives:

  * current invoice JSON (latest state)
  * correction text (typed or transcribed)
* AI returns updated invoice JSON
* Manual numeric edits (qty, price, GST) are preserved **unless explicitly overridden**

After applying changes, show a subtle summary:

* “Labour hours updated”
* “1 line item removed”
* “Customer name changed”

This reinforces trust.

---

## 4.4 Business Profiles

Users can create **multiple business profiles**.

Each profile includes:

* Trading name
* Business name
* ABN
* Address
* GST registered toggle
* Default hourly rate
* Bank details (BSB + account)
* PayID
* Optional external payment link (Stripe / Square / PayPal)
* Default invoice footer note

Each invoice is linked to **one business profile**.

---

## 4.5 Invoice Output & Delivery

### Output

* AU-compliant professional **PDF**
* Generated on demand

### Email Sending

* Sent via system email
* From: `invoices@syntyxlabs.com`
* Reply-To: tradie’s email
* PDF attached
* Optional **Pay Now** button if payment link exists

Multiple customer emails supported (comma or semicolon separated).

---

## 4.6 Invoice Dashboard & Status

Invoice lifecycle:

* Draft
* Sent
* Overdue
* Paid
* Void

Dashboard displays:

* invoice list
* status
* sent date
* due date
* amount
* actions: resend, mark paid

Payment status is **manually toggled** by tradie in v1.

---

## 4.7 Payment Reminders (v1.5)

### Reminder Types

* Manual “Send reminder”
* Automatic reminders (optional):

  * Before due date
  * On due date
  * X days after due

### Behaviour

* Reminder emails reuse original invoice PDF
* Same recipients as original invoice
* Stop immediately when invoice marked Paid

---

## 4.8 Photos

* Multiple photos per invoice supported
* Photos:

  * stored privately
  * embedded in PDF or linked
* Used as proof of work

No AI photo extraction in v1.

---

## 5. Explicit Non-Goals

The product will **not** include:

* Accounting
* Payroll
* Job scheduling
* Auto payment reconciliation
* Stripe Connect marketplace
* CRM
* AI auto-pricing
* Auto-sending invoices

---

## 6. Platform & Delivery

### Domain

```
https://invoices.syntyxlabs.com
```

### Platform Decision

* PWA **or**
* Native iOS

PRD is intentionally platform-agnostic.

---

## 7. Proposed Tech Stack

### Frontend

* Mobile-first UI
* PWA (React / Next.js) **or** native iOS (SwiftUI)
* Camera + microphone support
* Offline-tolerant where possible

### Backend

* Supabase

  * Auth
  * Postgres
  * Storage (photos, PDFs)
  * Row-level security
  * Scheduled jobs (reminders)

### AI

* Speech-to-text API
* LLM for structured invoice drafting + corrections
* Strict JSON schema enforcement

### Email

* Transactional email provider (SES / SendGrid)
* Domain-authenticated sender
* No mailbox required

### Payments

* Platform does not collect funds
* External payment links only (optional)

---

## 8. Security & Trust Principles

* No card data stored
* No auto-sending
* No silent AI edits
* All invoices human-approved
* Data isolated per user and business profile

---

## 9. Pricing (Initial)

* **AUD $29/month**
* Single plan
* Unlimited invoices
* No usage caps

Optional early-user discount.

---

## 10. Success Metrics

### Activation

* First invoice sent within 24 hours

### Engagement

* ≥ 3 invoices/week per active user

### Retention

* Active after 30 days

### Qualitative

* “I invoiced before I got home”
* “I stopped doing invoices at night”

---

## 11. Future Expansion (Out of Scope)

* `calls.syntyxlabs.com` (AI receptionist)
* Automatic payment reconciliation
* Stripe Connect
* Job/quote management
* Push notifications
* Native app wrappers

---

## 12. Summary

Syntyx Invoices is:

* narrow
* behaviour-aligned
* human-in-control
* low-risk
* fast to ship
* easy to price

The **voice + editable preview + correction loop** is the core differentiator.

---












Yep. Below are **working, official-SDK-style examples** for the two calls:

1. **Speech → text** using the Audio Transcriptions endpoint (`gpt-4o-mini-transcribe` or `gpt-4o-transcribe`) ([OpenAI Platform][1])
2. **Text → strict JSON** invoice drafting/corrections using the Responses API with **Structured Outputs / JSON Schema** ([OpenAI Platform][2])

I’m giving you **Node.js** and **Python**.

---

## Node.js (OpenAI SDK)

### 1) Speech-to-text (Audio → transcript)

```js
// stt.mjs
import fs from "fs";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function transcribeAudio(filePath) {
  const transcription = await client.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: "gpt-4o-mini-transcribe", // or "gpt-4o-transcribe"
    // response_format: "text", // optional
    // prompt: "Australian tradie invoicing, terms: PayID, BSB, ABN, Clipsal, GPO, RCD, Coburg", // optional
  });

  return transcription.text; // string
}

const text = await transcribeAudio("./voice-note.mp3");
console.log(text);
```

(Transcriptions endpoint example and fields match the docs.) ([OpenAI Platform][1])

---

### 2) LLM: Draft invoice JSON with strict schema (Structured Outputs)

```js
// invoice_draft.mjs
import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const invoiceSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    customer: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: { type: "string" },
        emails: { type: "array", items: { type: "string" } }
      },
      required: ["name", "emails"]
    },
    invoice: {
      type: "object",
      additionalProperties: false,
      properties: {
        invoice_date: { type: "string", description: "YYYY-MM-DD" },
        due_date: { type: "string", description: "YYYY-MM-DD" },
        currency: { type: "string", enum: ["AUD"] },
        gst_enabled: { type: "boolean" }
      },
      required: ["invoice_date", "due_date", "currency", "gst_enabled"]
    },
    line_items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          description: { type: "string" },
          quantity: { type: "number" },
          unit: { type: "string", description: "e.g. hr, ea, m" },
          unit_price: { type: ["number", "null"], description: "Leave null if unknown" }
        },
        required: ["description", "quantity", "unit", "unit_price"]
      }
    },
    notes: { type: "string" },
    changes_summary: { type: "array", items: { type: "string" } }
  },
  required: ["customer", "invoice", "line_items", "notes", "changes_summary"]
};

async function draftInvoiceFromText({ transcriptText, customerEmails = [] }) {
  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content:
          "You draft AU tradie invoices. Return only JSON that matches the schema. " +
          "Do not invent prices. If not stated, set unit_price=null. Currency is AUD."
      },
      {
        role: "user",
        content:
          `Voice/text input:\n${transcriptText}\n\n` +
          `Customer emails (if known): ${customerEmails.join(", ")}`
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "invoice_draft",
        strict: true,
        schema: invoiceSchema
      }
    }
  });

  // The SDK returns the text output; parse it as JSON.
  // Some SDK versions also provide helpers (e.g., responses.parse), but this is universal.
  const json = JSON.parse(response.output_text);
  return json;
}

// Example:
const draft = await draftInvoiceFromText({
  transcriptText: "Job for John Smith in Coburg. Replace two double power points. Labour 2 hours. Callout 90. Customer email accounts@acme.com",
  customerEmails: ["accounts@acme.com"]
});

console.log(draft);
```

(Structured Outputs via `text.format` with `type: "json_schema"` + `strict: true` is per docs.) ([OpenAI Platform][2])

---

### 3) LLM: Apply corrections (text OR transcribed voice) to the existing invoice JSON

```js
// invoice_apply_changes.mjs
import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function applyInvoiceChanges({ currentInvoiceJson, correctionText, invoiceSchema }) {
  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content:
          "You update an existing invoice JSON using the user's change request. " +
          "Return only JSON matching the schema. Preserve unit_price and gst_enabled unless explicitly requested."
      },
      {
        role: "user",
        content:
          `Current invoice JSON:\n${JSON.stringify(currentInvoiceJson)}\n\n` +
          `Change request:\n${correctionText}`
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "invoice_updated",
        strict: true,
        schema: invoiceSchema
      }
    }
  });

  return JSON.parse(response.output_text);
}
```

(Exact same structured-output mechanism, just different prompt and input.) ([OpenAI Platform][2])

---

## Python (OpenAI SDK)

### 1) Speech-to-text

```python
# stt.py
from openai import OpenAI

client = OpenAI()

def transcribe_audio(path: str) -> str:
    with open(path, "rb") as f:
        transcription = client.audio.transcriptions.create(
            model="gpt-4o-mini-transcribe",  # or "gpt-4o-transcribe"
            file=f,
            # response_format="text",
            # prompt="Australian tradie invoicing, terms: PayID, BSB, ABN, Clipsal, GPO, RCD, Coburg",
        )
    return transcription.text

print(transcribe_audio("voice-note.mp3"))
```

([OpenAI Platform][1])

---

### 2) Draft invoice JSON with strict schema

```python
# invoice_draft.py
import json
from openai import OpenAI

client = OpenAI()

invoice_schema = {
  "type": "object",
  "additionalProperties": False,
  "properties": {
    "customer": {
      "type": "object",
      "additionalProperties": False,
      "properties": {
        "name": {"type": "string"},
        "emails": {"type": "array", "items": {"type": "string"}}
      },
      "required": ["name", "emails"]
    },
    "invoice": {
      "type": "object",
      "additionalProperties": False,
      "properties": {
        "invoice_date": {"type": "string", "description": "YYYY-MM-DD"},
        "due_date": {"type": "string", "description": "YYYY-MM-DD"},
        "currency": {"type": "string", "enum": ["AUD"]},
        "gst_enabled": {"type": "boolean"}
      },
      "required": ["invoice_date", "due_date", "currency", "gst_enabled"]
    },
    "line_items": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
          "description": {"type": "string"},
          "quantity": {"type": "number"},
          "unit": {"type": "string"},
          "unit_price": {"type": ["number", "null"]}
        },
        "required": ["description", "quantity", "unit", "unit_price"]
      }
    },
    "notes": {"type": "string"},
    "changes_summary": {"type": "array", "items": {"type": "string"}}
  },
  "required": ["customer", "invoice", "line_items", "notes", "changes_summary"]
}

def draft_invoice(transcript_text: str, customer_emails=None):
    customer_emails = customer_emails or []

    response = client.responses.create(
        model="gpt-4.1-mini",
        input=[
            {
                "role": "system",
                "content": (
                    "You draft AU tradie invoices. Return only JSON that matches the schema. "
                    "Do not invent prices. If not stated, set unit_price=null. Currency is AUD."
                )
            },
            {
                "role": "user",
                "content": (
                    f"Voice/text input:\n{transcript_text}\n\n"
                    f"Customer emails (if known): {', '.join(customer_emails)}"
                )
            }
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": "invoice_draft",
                "strict": True,
                "schema": invoice_schema
            }
        }
    )

    return json.loads(response.output_text)

draft = draft_invoice(
    "Job for John Smith in Coburg. Replace two double power points. Labour 2 hours. Callout 90.",
    ["accounts@acme.com"]
)

print(json.dumps(draft, indent=2))
```

([OpenAI Platform][2])

---

## Notes to keep you out of trouble

* **STT model name**: docs list `gpt-4o-transcribe` and `gpt-4o-mini-transcribe` for `/v1/audio/transcriptions`. ([OpenAI Platform][1])
* **Structured Outputs**: use `text: { format: { type: "json_schema", strict: true, schema: ... } }` with the Responses API. ([OpenAI Platform][2])

If you tell me whether you’re building the backend in **Node** or **Python**, I’ll tighten this into a single “service module” (STT + draft + applyChanges) that you can drop into your project.

[1]: https://platform.openai.com/docs/guides/speech-to-text "Speech to text | OpenAI API"
[2]: https://platform.openai.com/docs/guides/structured-outputs "Structured model outputs | OpenAI API"

