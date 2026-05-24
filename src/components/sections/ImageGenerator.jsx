import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { SectionHeader } from '../ui/SectionHeader'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'
import { generateImage, ImageGenerationError } from '../../lib/api/generateImage'
import { saveRequest, updateRequest } from '../../lib/api/supabase'
import { promptPresets } from '../../data/promptPresets'
import { Wand2, ImageIcon, Download, RefreshCcw, Trash2 } from '../../icons'
import { useToast } from '../../context/useToast'

const HISTORY_KEY = 'vibeflow:generation-history'
const HISTORY_LIMIT = 8

async function blobUrlToBase64(url) {
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Failed to read generated image'))
        return
      }
      resolve(result.split(',')[1] || '')
    }
    reader.onerror = () => reject(reader.error || new Error('Failed to read generated image'))
    reader.readAsDataURL(blob)
  })
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function ImageGeneratorSection() {
  const shouldReduceMotion = useReducedMotion()
  const [prompt, setPrompt] = useState('')
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState(() => loadHistory())
  const abortRef = useRef(null)
  const toast = useToast()

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    } catch {
      /* quota/private mode — silently ignore */
    }
  }, [history])

  const handleGenerate = useCallback(async () => {
    const trimmed = prompt.trim()
    if (!trimmed || loading) return

    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    try {
      // Save to database first
      const requestId = await saveRequest(trimmed)

      if (!requestId) {
        // Request persistence is optional; generation still proceeds.
      }

      const url = await generateImage(trimmed, { signal: controller.signal })
      setImage({ url, prompt: trimmed, at: Date.now(), requestId })
      setHistory((prev) => [{ url, prompt: trimmed, at: Date.now(), requestId: requestId || Date.now() }, ...prev].slice(0, HISTORY_LIMIT))

      if (requestId) {
        blobUrlToBase64(url)
          .then((base64) => updateRequest(requestId, base64))
          .catch((err) => {
            if (import.meta.env.DEV) {
              console.warn('[Supabase] Failed to persist generated image:', err?.message || err)
            }
          })
      }
    } catch (err) {
      if (err?.name === 'AbortError') return
      if (err instanceof ImageGenerationError) {
        toast.error('Generation failed', err.message)
      } else {
        toast.error('Generation failed', 'Something unexpected happened. Try again.')
      }
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }, [prompt, loading, toast])

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleGenerate()
    }
  }

  return (
    <section className="image-generation-section" id="image-generation">
      <div className="container">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={shouldReduceMotion ? undefined : { duration: 0.6 }}
        >
          <SectionHeader
            label="Free Tool"
            title="AI Image Generator"
            subtitle="Generate stunning images instantly with AI. It's completely free — no signup required."
            center
          />
        </motion.div>

        <motion.div 
          className="image-generator"
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={shouldReduceMotion ? undefined : { duration: 0.6, delay: 0.2 }}
        >
          <div className="prompt-presets" role="group" aria-label="Example prompts">
            {promptPresets.slice(0, 6).map((p) => (
              <button
                key={p}
                className="prompt-preset"
                type="button"
                onClick={() => setPrompt(p)}
              >
                {p.length > 40 ? p.slice(0, 40) + '…' : p}
              </button>
            ))}
          </div>

          <div className="generator-input">
            <label htmlFor="prompt-input" className="sr-only">Image prompt</label>
            <input
              id="prompt-input"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Describe the image you want… (e.g. astronaut riding a horse)"
              maxLength={500}
              autoComplete="off"
            />
            <Button
              variant="primary"
              className="generate-btn"
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              loading={loading}
            >
              {!loading && <Wand2 size={18} aria-hidden="true" />}
              {loading ? 'Generating' : 'Generate'}
            </Button>
          </div>

          {image ? (
            <div className="generated-image-container">
              <img src={image.url} alt={image.prompt || 'Generated image'} className="generated-image" />
              <div className="generator-actions">
                <a href={image.url} download="vibeflow-generated.png" className="download-btn">
                  <Download size={16} aria-hidden="true" /> Download
                </a>
                <Button
                  variant="ghost"
                  onClick={() => { setPrompt(image.prompt); handleGenerate() }}
                  disabled={loading}
                >
                  <RefreshCcw size={16} aria-hidden="true" /> Regenerate
                </Button>
              </div>
            </div>
          ) : loading ? (
            <div className="generator-placeholder">
              <Spinner size="lg" />
              <p style={{ marginTop: 12 }}>Rendering your prompt… this usually takes 10–20 seconds.</p>
            </div>
          ) : (
            <div className="generator-placeholder">
              <div className="placeholder-icon"><ImageIcon size={32} /></div>
              <p>Your generated image will appear here.</p>
            </div>
          )}

          {history.length > 0 && (
            <div className="generation-history">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <h3 style={{ margin: 0 }}>Recent generations</h3>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setHistory([])}
                  aria-label="Clear history"
                >
                  <Trash2 size={14} aria-hidden="true" /> Clear
                </button>
              </div>
              <div className="history-grid">
                {history.map((item) => (
                  <button
                    key={item.at}
                    type="button"
                    className="history-item"
                    onClick={() => setImage(item)}
                    title={item.prompt}
                    aria-label={`Reopen generation: ${item.prompt}`}
                  >
                    <img src={item.url} alt={item.prompt} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
