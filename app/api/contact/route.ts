import { Resend } from 'resend';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return Response.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  const { name, email, message } = body as Record<string, unknown>;

  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof message !== 'string' ||
    !name.trim() ||
    !emailPattern.test(email.trim()) ||
    !message.trim() ||
    name.length > 120 ||
    email.length > 254 ||
    message.length > 5000
  ) {
    return Response.json(
      { error: 'Revisa los datos del formulario.' },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.RESEND_TO_EMAIL;

  if (!apiKey || !from || !to) {
    console.error(
      'Contact email is not configured: missing Resend environment variables.',
    );
    return Response.json(
      { error: 'El servicio de correo no está configurado.' },
      { status: 503 },
    );
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email.trim(),
      subject: `Nuevo mensaje de contacto: ${name.trim()}`,
      text: `Nombre: ${name.trim()}\nCorreo: ${email.trim()}\n\nMensaje:\n${message.trim()}`,
    });

    if (error) {
      console.error('Resend could not send the contact email:', error);
      return Response.json(
        { error: 'No se pudo enviar el mensaje.' },
        { status: 502 },
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Unexpected error sending the contact email:', error);
    return Response.json(
      { error: 'No se pudo enviar el mensaje.' },
      { status: 500 },
    );
  }
}
