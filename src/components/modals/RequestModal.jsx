import { useCallback, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { RequestForm } from '../forms/RequestForm'
import { useToast } from '../../context/useToast'
import { submitProjectRequest } from '../../lib/submitProjectRequest'
import { Check } from '../../icons'

export function RequestModal({ isOpen, onClose }) {
  const [submitted, setSubmitted] = useState(false)
  const [submittedName, setSubmittedName] = useState('')
  const toast = useToast()

  // Reset on close (no setState-in-effect). This guarantees the form
  // is fresh next time the modal is opened.
  const handleClose = useCallback(() => {
    setSubmitted(false)
    setSubmittedName('')
    onClose?.()
  }, [onClose])

  const handleSubmit = async (values) => {
    const { saved } = await submitProjectRequest(values)
    if (!saved) {
      toast.error('Could not save request', 'Please try again or email us directly.')
      return
    }
    setSubmittedName(values.name)
    setSubmitted(true)
    toast.success('Request submitted', "We'll reach out within 24 hours.")
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={submitted ? undefined : 'Submit a Request'}
      subtitle={submitted ? undefined : "Tell us what you need and we'll handle the rest."}
    >
      {submitted ? (
        <div className="success-message">
          <div className="success-icon"><Check size={36} /></div>
          <h2>Request submitted!</h2>
          <p>
            Thanks{submittedName ? `, ${submittedName.split(' ')[0]}` : ''}. Our team will review
            your request and get back to you within 24 hours.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={() => setSubmitted(false)}>
              Submit Another Request
            </Button>
            <Button variant="ghost" onClick={handleClose}>Close</Button>
          </div>
        </div>
      ) : (
        <RequestForm onSubmit={handleSubmit} />
      )}
    </Modal>
  )
}
