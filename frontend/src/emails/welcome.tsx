import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface WelcomeEmailProps {
  firstName: string
  referralCode?: string
}

export function WelcomeEmail({ firstName, referralCode }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to CraftlyCV — Your AI-powered resume optimization tool is ready.</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>Welcome to CraftlyCV</Heading>

          <Text style={styles.text}>Hi {firstName},</Text>
          <Text style={styles.text}>
            Your AI-powered resume optimization tool is ready. With your 3 free scans, you can
            analyze your resume, get actionable suggestions, and land more interviews.
          </Text>

          {referralCode && (
            <Section style={styles.referralSection}>
              <Text style={styles.referralText}>
                You were referred by a friend — your first scan is already loaded!
              </Text>
            </Section>
          )}

          <Section style={styles.buttonSection}>
            <Button href="https://craftlycv.in/analyze" style={styles.button}>
              Analyze My Resume
            </Button>
          </Section>

          <Hr style={styles.hr} />

          <Text style={styles.footer}>
            You received this email because you signed up for CraftlyCV.
            <br />
            <Link href="https://craftlycv.in/settings" style={styles.link}>
              Manage your preferences
            </Link>{' '}
            |{' '}
            <Link href="https://craftlycv.in/unsubscribe" style={styles.link}>
              Unsubscribe
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const styles = {
  body: {
    backgroundColor: '#09090b',
    fontFamily: 'Arial, sans-serif',
  },
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  heading: {
    color: '#fafafa',
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '24px',
    textAlign: 'center' as const,
  },
  text: {
    color: '#a1a1aa',
    fontSize: '16px',
    lineHeight: '24px',
    marginBottom: '16px',
  },
  referralSection: {
    backgroundColor: '#18181b',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
  },
  referralText: {
    color: '#22c55e',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '0',
    textAlign: 'center' as const,
  },
  buttonSection: {
    textAlign: 'center' as const,
    marginBottom: '32px',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    padding: '12px 32px',
    textDecoration: 'none',
  },
  hr: {
    borderColor: '#27272a',
    marginBottom: '24px',
  },
  footer: {
    color: '#71717a',
    fontSize: '12px',
    lineHeight: '20px',
    textAlign: 'center' as const,
  },
  link: {
    color: '#3b82f6',
    textDecoration: 'none',
  },
}
