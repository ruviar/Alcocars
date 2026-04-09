export interface ClientConfirmationData {
  confirmationCode: string;
  firstName: string;
  lastName: string;
  email: string;
  categoryName: string;
  officeName: string;
  officeAddress: string;
  officePhone: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  estimatedKm: number;
  includedKm: number;
  extraKm: number;
  baseRate: number;
  extraKmCharge: number;
  extrasTotal: number;
  totalAmount: number;
  deposit: number;
  franchise: number;
}

export function clientConfirmationHtml(data: ClientConfirmationData): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de reserva — Alcocars</title>
</head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;">
        <!-- Header -->
        <tr>
          <td style="background:#012169;padding:32px 40px;">
            <h1 style="margin:0;color:#97D700;font-size:28px;font-weight:bold;">Alcocars</h1>
            <p style="margin:8px 0 0;color:#ffffff;font-size:14px;">Renting a medida</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="color:#012169;font-size:22px;margin:0 0 16px;">¡Reserva confirmada!</h2>
            <p style="color:#475569;font-size:15px;line-height:1.6;">
              Hola <strong>${data.firstName}</strong>, tu reserva ha sido recibida correctamente.
            </p>

            <!-- Confirmation code -->
            <div style="background:#f0f7ff;border-left:4px solid #97D700;padding:16px 20px;margin:24px 0;border-radius:4px;">
              <p style="margin:0;color:#475569;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Código de reserva</p>
              <p style="margin:8px 0 0;color:#012169;font-size:28px;font-weight:bold;letter-spacing:4px;">${data.confirmationCode}</p>
            </div>

            <!-- Rental details -->
            <h3 style="color:#012169;font-size:16px;margin:24px 0 12px;">Detalles del alquiler</h3>
            <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
              <tr style="border-bottom:1px solid #e8edf4;">
                <td style="color:#475569;font-size:14px;width:50%;">Categoría</td>
                <td style="color:#0b1f3a;font-size:14px;font-weight:600;">${data.categoryName}</td>
              </tr>
              <tr style="border-bottom:1px solid #e8edf4;">
                <td style="color:#475569;font-size:14px;">Oficina de recogida</td>
                <td style="color:#0b1f3a;font-size:14px;">${data.officeName} — ${data.officeAddress}</td>
              </tr>
              <tr style="border-bottom:1px solid #e8edf4;">
                <td style="color:#475569;font-size:14px;">Fechas</td>
                <td style="color:#0b1f3a;font-size:14px;">${data.startDate} → ${data.endDate} (${data.totalDays} días)</td>
              </tr>
              <tr style="border-bottom:1px solid #e8edf4;">
                <td style="color:#475569;font-size:14px;">Km incluidos</td>
                <td style="color:#0b1f3a;font-size:14px;">${data.includedKm} km</td>
              </tr>
              <tr style="border-bottom:1px solid #e8edf4;">
                <td style="color:#475569;font-size:14px;">Km previstos</td>
                <td style="color:#0b1f3a;font-size:14px;">${data.estimatedKm} km</td>
              </tr>
              ${data.extraKm > 0 ? `
              <tr style="border-bottom:1px solid #e8edf4;">
                <td style="color:#475569;font-size:14px;">Km extra</td>
                <td style="color:#0b1f3a;font-size:14px;">${data.extraKm} km (+${data.extraKmCharge.toFixed(2)} €)</td>
              </tr>` : ''}
            </table>

            <!-- Price breakdown -->
            <h3 style="color:#012169;font-size:16px;margin:24px 0 12px;">Resumen de precio</h3>
            <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
              <tr style="border-bottom:1px solid #e8edf4;">
                <td style="color:#475569;font-size:14px;">Tarifa base (${data.totalDays} días)</td>
                <td style="color:#0b1f3a;font-size:14px;" align="right">${data.baseRate.toFixed(2)} €</td>
              </tr>
              ${data.extraKmCharge > 0 ? `
              <tr style="border-bottom:1px solid #e8edf4;">
                <td style="color:#475569;font-size:14px;">Sobrecoste km extra</td>
                <td style="color:#0b1f3a;font-size:14px;" align="right">${data.extraKmCharge.toFixed(2)} €</td>
              </tr>` : ''}
              ${data.extrasTotal > 0 ? `
              <tr style="border-bottom:1px solid #e8edf4;">
                <td style="color:#475569;font-size:14px;">Extras</td>
                <td style="color:#0b1f3a;font-size:14px;" align="right">${data.extrasTotal.toFixed(2)} €</td>
              </tr>` : ''}
              <tr style="border-top:2px solid #012169;">
                <td style="color:#012169;font-size:16px;font-weight:bold;">TOTAL</td>
                <td style="color:#012169;font-size:16px;font-weight:bold;" align="right">${data.totalAmount.toFixed(2)} €</td>
              </tr>
            </table>

            <!-- Deposit info -->
            <div style="background:#fff8e6;border:1px solid #f5c842;padding:16px 20px;margin:24px 0;border-radius:4px;">
              <p style="margin:0;color:#7a5c00;font-size:14px;line-height:1.6;">
                <strong>Fianza:</strong> ${data.deposit.toFixed(2)} € (retenida en tarjeta a la recogida)<br>
                <strong>Franquicia:</strong> ${data.franchise.toFixed(2)} € en caso de daños
              </p>
            </div>

            <p style="color:#475569;font-size:14px;line-height:1.6;">
              Para cualquier consulta llámanos a <strong>${data.officePhone}</strong>.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f5f7fa;padding:24px 40px;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">© 2026 Alcocars. Todos los derechos reservados.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
