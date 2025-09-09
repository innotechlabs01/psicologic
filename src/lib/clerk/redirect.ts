export function redirectByRole(url: string, role: string | undefined): Response {
  switch (role) {
    case 'org:admin':
      return Response.redirect(new URL('/dashboard', url));
    case 'org:client':
      return Response.redirect(new URL('/client', url));
    default:
      return Response.redirect(new URL('/Not_Found', url));
  }
}
