<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { font-family: DejaVu Sans, sans-serif; }
  body { color: #1f2937; font-size: 12px; margin: 0; padding: 32px; }
  .header { display: flex; justify-content: space-between; border-bottom: 3px solid #1463e1; padding-bottom: 16px; }
  .brand { font-size: 22px; font-weight: bold; color: #1463e1; }
  .brand small { display: block; font-size: 10px; color: #6b7280; font-weight: normal; }
  h1 { font-size: 18px; margin: 0; text-align: right; }
  .muted { color: #6b7280; }
  .meta { margin-top: 24px; width: 100%; }
  .meta td { vertical-align: top; padding: 2px 0; }
  table.items { width: 100%; border-collapse: collapse; margin-top: 28px; }
  table.items th { background: #f3f4f6; text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; color: #6b7280; }
  table.items td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
  .right { text-align: right; }
  .totals { margin-top: 16px; width: 40%; float: right; }
  .totals td { padding: 4px 8px; }
  .totals .grand { font-size: 14px; font-weight: bold; border-top: 2px solid #1f2937; }
  .badge { padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
  .paid { background: #dcfce7; color: #15803d; }
  .pending { background: #fef9c3; color: #a16207; }
  .overdue { background: #fee2e2; color: #b91c1c; }
  .partial { background: #dbeafe; color: #1d4ed8; }
  .footer { clear: both; margin-top: 60px; text-align: center; color: #9ca3af; font-size: 10px; }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">MediCore HMS<small>123 Healthcare Blvd, Springfield, IL 62704</small></div>
    <div>
      <h1>INVOICE</h1>
      <div class="right muted">{{ $invoice->invoice_number }}</div>
    </div>
  </div>

  <table class="meta">
    <tr>
      <td>
        <strong>Billed to</strong><br>
        {{ $invoice->patient_name }}
      </td>
      <td class="right">
        <strong>Issued:</strong> {{ optional($invoice->date)->format('M d, Y') }}<br>
        <strong>Due:</strong> {{ optional($invoice->due_date)->format('M d, Y') }}<br>
        <strong>Status:</strong>
        <span class="badge {{ strtolower($invoice->status) }}">{{ $invoice->status }}</span>
      </td>
    </tr>
  </table>

  <table class="items">
    <thead>
      <tr>
        <th>Description</th>
        <th class="right">Qty</th>
        <th class="right">Unit price</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>
      @foreach ($invoice->items ?? [] as $item)
        <tr>
          <td>{{ $item['description'] ?? '' }}</td>
          <td class="right">{{ $item['quantity'] ?? 0 }}</td>
          <td class="right">${{ number_format((float) ($item['unitPrice'] ?? 0), 2) }}</td>
          <td class="right">${{ number_format((float) ($item['total'] ?? 0), 2) }}</td>
        </tr>
      @endforeach
    </tbody>
  </table>

  <table class="totals">
    <tr><td>Subtotal</td><td class="right">${{ number_format((float) $invoice->amount, 2) }}</td></tr>
    <tr><td>Paid</td><td class="right">${{ number_format((float) $invoice->paid_amount, 2) }}</td></tr>
    <tr class="grand"><td>Balance due</td><td class="right">${{ number_format((float) $balance, 2) }}</td></tr>
  </table>

  <div class="footer">Thank you for choosing MediCore. Questions? billing@medicore.test</div>
</body>
</html>
