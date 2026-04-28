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

interface PaymentConfirmationEmailProps {
  firstName: string
  planName: string
  amount: string
  scans: number
}

export function PaymentConfirmationEmail({ firstName, planName, amount, scans }: PaymentConfirmationEmailProps) {
  const features = [
    'Unlimited resume scans',
    'AI-powered tailoring',
    'Cover letter generation',
    'Job application tracking',
  ]

  return (
    <Html>
      <Head />
      <Preview>Your CraftlyCV payment has been confirmed.</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.checkmarkSection}>
            <Text style={styles.checkmark}>✓</Text>
          </Section>

          <Heading style={styles.heading}>Payment Confirmed</Heading>

          <Text style={styles.text}>Hi {firstName},</Text>
          <Text style={styles.text}>
            Thank you for your purchase! Your payment has been successfully processed.
          </Text>

          <Section style={styles.summarySection}>
            <Text style={styles.planName}>{planName}</Text>
            <Text style={styles.amount}>{amount}</Text>
            <Hr style={styles.divider} />
            <Text style={styles.balanceText}>Your new scan balance: {scans} scans</Text>
          </Section>

          <Section style={styles.featuresSection}>
            <Text style={styles.featuresHeading}>What&apos;s unlocked:</Text>
            {features.map((feature, index) => (
              <Text key={index} style={styles.featureItem}>
                • {feature}
              </Text>
            ))}
          </Section>

          <Section style={styles.buttonSection}>
            <Button href="https://craftlycv.in/analyze" style={styles.button}>
              Start Using CraftlyCV
            </Button>
          </Section>

          <Hr style={styles.hr} />

          <Text style={styles.footer}>
            Questions? Contact us at{' '}
            <Link href="mailto:support@craftlycv.in" style={styles.link}>
              support@craftlycv.in
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
  checkmarkSection: {
    textAlign: 'center' as const,
    marginBottom: '16px',
  },
  checkmark: {
    color: '#22c55e',
    fontSize: '48px',
    fontWeight: 'bold',
    margin: '0',
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
  summarySection: {
    backgroundColor: '#18181b',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
    textAlign: 'center' as const,
  },
  planName: {
    color: '#fafafa',
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  amount: {
    color: '#3b82f6',
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '16px',
  },
  divider: {
    borderColor: '#27272a',
    marginBottom: '16px',
  },
  balanceText: {
    color: '#22c55e',
    fontSize: '18px',
    fontWeight: '500',
    marginBottom: '0',
  },
  featuresSection: {
    marginBottom: '32px',
  },
  featuresHeading: {
    color: '#fafafa',
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px',
  },
  featureItem: {
    color: '#a1a1aa',
    fontSize: '14px',
    lineHeight: '22px',
    marginBottom: '8px',
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
