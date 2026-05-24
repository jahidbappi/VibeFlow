import { useOutletContext } from 'react-router-dom'
import { Mail, Phone, MapPin } from 'lucide-react'
import { useSEO } from '../hooks/useSEO'
import { Button } from '../components/ui/Button'
import { RequestForm } from '../components/forms/RequestForm'
import { useToast } from '../context/useToast'
import { submitProjectRequest } from '../lib/submitProjectRequest'
import { env } from '../lib/env'

export default function ContactPage() {
  const { openRequestModal } = useOutletContext()
  const toast = useToast()
  useSEO({
    title: 'Contact',
    description:
      'Get in touch with the Vibe Flow team. Email, phone, or submit a project brief directly.',
  })

  return (
    <div className="page">
      <div className="container page-hero">
        <h1>Let's talk.</h1>
        <p>Email us, call us, or submit a project brief — whichever feels right.</p>
      </div>

      <div className="container">
        <div className="contact-grid">
          <aside>
            <div className="contact-info">
              <h3>Reach out directly</h3>
              <p>
                We reply within 24 hours on business days. For urgent matters,
                mention "urgent" in the subject line.
              </p>

              <div className="contact-detail">
                <div className="contact-detail-icon"><Mail size={18} /></div>
                <div>
                  <h4>Email</h4>
                  <p><a href={`mailto:${env.VITE_CONTACT_EMAIL}`}>{env.VITE_CONTACT_EMAIL}</a></p>
                </div>
              </div>

              <div className="contact-detail">
                <div className="contact-detail-icon"><Phone size={18} /></div>
                <div>
                  <h4>Phone</h4>
                  <p>+1 (555) 010-0134</p>
                </div>
              </div>

              <div className="contact-detail">
                <div className="contact-detail-icon"><MapPin size={18} /></div>
                <div>
                  <h4>Studio</h4>
                  <p>Remote-first · HQ in Austin, TX</p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 28 }}>
              <Button variant="ghost" onClick={openRequestModal}>
                Or open the request modal →
              </Button>
            </div>
          </aside>

          <div className="card">
            <h3 style={{ marginBottom: 8 }}>Or submit a brief here</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              Same form, directly on the page.
            </p>
            <RequestForm
              onSubmit={async (values) => {
                const { saved } = await submitProjectRequest(values)
                if (!saved) {
                  toast.error('Could not send message', 'Please try again or email us directly.')
                  return
                }
                toast.success('Message sent!', "We'll reach out within 24 hours.")
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
