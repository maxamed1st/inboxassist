export type PersistEmailAccountProps = {
  userId: string,
  provider: "microsoft" | "google",
  providerAccountId: string,
  displayName: string,
  imapHost: string,
  smtpHost: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: Date | number | null
}
