<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { font-family: DejaVu Sans, sans-serif; }
  body { color: #1f2937; font-size: 12px; margin: 0; padding: 32px; }
  .header { display: flex; justify-content: space-between; border-bottom: 3px solid #15803d; padding-bottom: 16px; }
  .brand { font-size: 22px; font-weight: bold; color: #15803d; }
  .brand small { display: block; font-size: 10px; color: #6b7280; font-weight: normal; }
  h1 { font-size: 18px; margin: 0; text-align: right; letter-spacing: 1px; }
  .muted { color: #6b7280; }
  .meta { margin-top: 24px; width: 100%; }
  .meta td { vertical-align: top; padding: 2px 0; }
  table.items { width: 100%; border-collapse: collapse; margin-top: 28px; }
  table.items th { background: #f0fdf4; text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; color: #15803d; }
  table.items td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
  table.items td.name { font-weight: bold; }
  table.items td.unit-tag { color: #6b7280; font-size: 10px; }
  .right { text-align: right; }
  .center { text-align: center; }
  .totals { margin-top: 16px; width: 45%; float: right; }
  .totals td { padding: 4px 8px; }
  .totals .grand { font-size: 15px; font-weight: bold; border-top: 2px solid #1f2937; color: #15803d; }
  .badge { padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
  .paid { background: #dcfce7; color: #15803d; }
  .pending { background: #fef9c3; color: #a16207; }
  .partial { background: #dbeafe; color: #1d4ed8; }
  .footer { clear: both; margin-top: 60px; text-align: center; color: #9ca3af; font-size: 10px; }
  .footer strong { color: #6b7280; }
  .brand small.tax { color: #1f2937; font-weight: bold; margin-top: 3px; }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">{{ config('hospital.pharmacy_name') }}<small>{{ config('hospital.address') }} · {{ config('hospital.phone') }}</small>
      @if (config('hospital.tax_number'))
        <small class="tax">{{ config('hospital.tax_label') }}: {{ config('hospital.tax_number') }}</small>
      @endif
    </div>
    <div>
      <h1>MEDICINE INVOICE</h1>
      <div class="right muted">{{ $sale->sale_number }}</div>
    </div>
  </div>

  <table class="meta">
    <tr>
      <td>
        <strong>Customer</strong><br>
        {{ $sale->customer_name }}
        @if ($sale->customer_phone)
          <br>{{ $sale->customer_phone }}
        @endif
      </td>
      <td class="right">
        <strong>Date:</strong> {{ optional($sale->date)->format('M d, Y') }}<br>
        <strong>Served by:</strong> {{ $sale->servedBy?->name ?? 'Front desk' }}<br>
        <strong>Status:</strong>
        <span class="badge {{ strtolower($sale->status) }}">{{ $sale->status }}</span>
      </td>
    </tr>
  </table>

  <table class="items">
    <thead>
      <tr>
        <th>Medicine</th>
        <th class="center">Qty</th>
        <th class="right">Unit price</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>
      @foreach ($sale->items ?? [] as $item)
        <tr>
          <td class="name">{{ $item['name'] ?? '' }} <span class="unit-tag">({{ $item['unit'] ?? 'unit' }})</span></td>
          <td class="center">{{ $item['quantity'] ?? 0 }}</td>
          <td class="right">${{ number_format((float) ($item['unitPrice'] ?? 0), 2) }}</td>
          <td class="right">${{ number_format((float) ($item['total'] ?? 0), 2) }}</td>
        </tr>
      @endforeach
    </tbody>
  </table>

  <table class="totals">
    <tr><td>Subtotal</td><td class="right">${{ number_format((float) $sale->subtotal, 2) }}</td></tr>
    @if ($sale->discount > 0)
      <tr><td>Discount</td><td class="right">-${{ number_format((float) $sale->discount, 2) }}</td></tr>
    @endif
    @if ($sale->tax > 0)
      <tr><td>Tax</td><td class="right">${{ number_format((float) $sale->tax, 2) }}</td></tr>
    @endif
    <tr class="grand"><td>Total</td><td class="right">${{ number_format((float) $sale->total, 2) }}</td></tr>
    <tr><td>Paid ({{ $sale->payment_method ?? 'N/A' }})</td><td class="right">${{ number_format((float) $sale->paid_amount, 2) }}</td></tr>
    @if ($balance > 0)
      <tr><td>Balance due</td><td class="right">${{ number_format($balance, 2) }}</td></tr>
    @endif
  </table>

  <div class="footer">
    <strong>Please verify medicines and dosage before use.</strong><br>
    Thank you for choosing MediCore Pharmacy. Questions? pharmacy@medicore.test
  </div>
</body>
</html>
