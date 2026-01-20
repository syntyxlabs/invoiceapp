interface InvoiceTotalsProps {
  subtotal: number
  gstAmount: number
  total: number
  gstEnabled: boolean
  pricesIncludeGst?: boolean
}

export function InvoiceTotals({
  subtotal,
  gstAmount,
  total,
  gstEnabled,
  pricesIncludeGst = false
}: InvoiceTotalsProps) {
  // If prices include GST, we need to show the breakdown differently
  // subtotal already includes GST, so we back-calculate
  const displaySubtotal = pricesIncludeGst && gstEnabled
    ? subtotal / 1.1
    : subtotal

  const displayGst = pricesIncludeGst && gstEnabled
    ? subtotal - displaySubtotal
    : gstAmount

  const displayTotal = pricesIncludeGst && gstEnabled
    ? subtotal
    : total

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex justify-between w-56">
        <span className="text-muted-foreground">
          Subtotal {pricesIncludeGst && gstEnabled ? '(ex GST)' : ''}:
        </span>
        <span>${displaySubtotal.toFixed(2)}</span>
      </div>

      {gstEnabled && (
        <div className="flex justify-between w-56">
          <span className="text-muted-foreground">GST (10%):</span>
          <span>${displayGst.toFixed(2)}</span>
        </div>
      )}

      <div className="flex justify-between w-56 text-lg font-bold border-t pt-2">
        <span>Total {gstEnabled ? '(inc GST)' : ''}:</span>
        <span>${displayTotal.toFixed(2)} AUD</span>
      </div>

      {gstEnabled && (
        <p className="text-xs text-muted-foreground mt-1">
          {pricesIncludeGst
            ? 'Line item prices include GST'
            : 'Line item prices exclude GST'}
        </p>
      )}
    </div>
  )
}
