export interface AdminNotificationData {
  confirmationCode: string;
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  categoryName: string;
  officeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  estimatedKm: number;
  totalAmount: number;
}

export function adminNotificationHtml(data: AdminNotificationData): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Nueva reserva — ${data.confirmationCode}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f5f7fa;padding:40px;">
  <div style="max-width:500px;margin:0 auto;background:#ffffff;border-radius:8px;padding:32px;">
    <h2 style="color:#012169;margin:0 0 24px;">Nueva reserva recibida</h2>
    <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
      <tr><td style="color:#475569;width:40%;">Código</td><td style="font-weight:bold;color:#012169;font-size:18px;">${data.confirmationCode}</td></tr>
      <tr><td style="color:#475569;">Cliente</td><td>${data.clientFirstName} ${data.clientLastName}</td></tr>
      <tr><td style="color:#475569;">Email</td><td><a href="mailto:${data.clientEmail}">${data.clientEmail}</a></td></tr>
      <tr><td style="color:#475569;">Categoría</td><td>${data.categoryName}</td></tr>
      <tr><td style="color:#475569;">Oficina</td><td>${data.officeName}</td></tr>
      <tr><td style="color:#475569;">Fechas</td><td>${data.startDate} → ${data.endDate} (${data.totalDays} días)</td></tr>
      <tr><td style="color:#475569;">Km previstos</td><td>${data.estimatedKm} km</td></tr>
      <tr style="border-top:2px solid #012169;"><td style="font-weight:bold;">TOTAL</td><td style="font-weight:bold;color:#012169;">${data.totalAmount.toFixed(2)} €</td></tr>
    </table>
  </div>
</body>
</html>`;
}
