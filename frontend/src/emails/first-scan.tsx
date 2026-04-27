import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Section,
  Text,
} from '@react-email/components'

interface FirstScanEmailProps {
  firstName: string
  score: number
  topSuggestions: string[]
}

export function FirstScanEmail({ firstName, score, topSuggestions }: FirstScanEmailProps) {
  const scoreColor = score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444'
  const showUpgradeCta = score < 75

  return (
    <Html>
      <Head />
      <Preview>Your first CraftlyCV resume scan is complete.</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>Your ATS Score is {score}/100</Heading>

          <Section style={styles.scoreSection}>
            <Text style={{ ...styles.scoreNumber, color: scoreColor }}>{score}</Text>
            <Text style={styles.scoreLabel}>out of 100</Text>
          </Section>

          <Text style={styles.greeting}>Hi {firstName},</Text>
          <Text style={styles.text}>Here&apos;s what we found:</Text>

          <Section style={styles.suggestionsSection}>
            {topSuggestions.slice(0, 4).map((suggestion, index) => (
              <Text key={index} style={styles.suggestionItem}>
                • {suggestion}
              </Text>
            ))}
          </Section>

          {showUpgradeCta && (
            <Section style={styles.buttonSection}>
              <Button href="https://craftlycv.in/tailor" style={styles.button}>
                Upgrade for Tailoring
              </Button>
            </Section>
          )}

          <Hr style={styles.hr} />

          <Text style={styles.footer}>
            <Link href="https://craftlycv.in/analyze" style={styles.link}>
              View full analysis
            </Link>{' '}
            |{' '}
            <Link href="https://craftlycv.in/settings" style={styles.link}>
              Settings
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
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '24px',
    textAlign: 'center' as const,
  },
  scoreSection: {
    textAlign: 'center' as const,
    marginBottom: '32px',
  },
  scoreNumber: {
    fontSize: '72px',
    fontWeight: 'bold',
    marginBottom: '0',
    lineHeight: '1',
  },
  scoreLabel: {
    color: '#71717a',
    fontSize: '14px',
    marginBottom: '0',
  },
  greeting: {
    color: '#a1a1aa',
    fontSize: '16px',
    marginBottom: '8px',
  },
  text: {
    color: '#a1a1aa',
    fontSize: '16px',
    lineHeight: '24px',
    marginBottom: '16px',
  },
  suggestionsSection: {
    backgroundColor: '#18181b',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
  },
  suggestionItem: {
    color: '#a1a1aa',
    fontSize: '14px',
    lineHeight: '22px',
    marginBottom: '12px',
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
