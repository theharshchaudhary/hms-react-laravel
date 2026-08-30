<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { font-family: DejaVu Sans, sans-serif; }
  body { color: #1f2937; font-size: 11px; margin: 0; padding: 32px; }
  .header { border-bottom: 3px solid #1463e1; padding-bottom: 12px; margin-bottom: 20px; }
  .brand { font-size: 16px; font-weight: bold; color: #1463e1; }
  h1 { font-size: 18px; margin: 4px 0 0; }
  .muted { color: #6b7280; font-size: 10px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: #f3f4f6; text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; color: #6b7280; }
  td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #fafafa; }
  .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 9px; }
  .empty { padding: 24px; text-align: center; color: #9ca3af; }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">MediCore HMS</div>
    <h1>{{ $title }}</h1>
    <div class="muted">Generated {{ now()->format('F j, Y \a\t g:i A') }} · {{ count($rows) }} rows</div>
  </div>

  @if (count($rows))
    <table>
      <thead>
        <tr>@foreach ($columns as $c)<th>{{ $c }}</th>@endforeach</tr>
      </thead>
      <tbody>
        @foreach ($rows as $row)
          <tr>@foreach ($row as $cell)<td>{{ $cell }}</td>@endforeach</tr>
        @endforeach
      </tbody>
    </table>
  @else
    <div class="empty">No data for this report yet.</div>
  @endif

  <div class="footer">MediCore Hospital Management System — confidential</div>
</body>
</html>
