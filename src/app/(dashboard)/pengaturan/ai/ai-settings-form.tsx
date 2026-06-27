'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { saveAISettingsAction, testAIAction } from './actions'
import type { AISettings } from '@/lib/ai/client'

interface Props {
  initialSettings: Record<string, string>
}

export function AISettingsForm({ initialSettings }: Props) {
  const [settings, setSettings] = useState(initialSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testReply, setTestReply] = useState<string | null>(null)

  const update = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    const formData = new FormData()
    Object.entries(settings).forEach(([key, value]) => formData.set(key, value))

    const res = await saveAISettingsAction(formData)
    setIsSaving(false)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Pengaturan AI disimpan')
    }
  }

  const handleTest = async () => {
    setIsTesting(true)
    setTestReply(null)
    const aiSettings: AISettings = {
      provider: settings['ai_provider'] || 'openai',
      model: settings['ai_model'] || 'gpt-4o-mini',
      baseUrl: settings['ai_base_url'] || null,
      apiKey: null,
    }
    const res = await testAIAction(aiSettings)
    setIsTesting(false)
    if (res.error) {
      toast.error(res.error)
    } else {
      setTestReply(res.reply || 'AI merespons')
      toast.success('Tes AI berhasil')
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ai_provider">Provider</Label>
          <Input
            id="ai_provider"
            value={settings['ai_provider'] || 'openai'}
            onChange={(e) => update('ai_provider', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ai_model">Model</Label>
          <Input
            id="ai_model"
            value={settings['ai_model'] || 'gpt-4o-mini'}
            onChange={(e) => update('ai_model', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ai_base_url">Base URL (kosongkan untuk OpenAI)</Label>
        <Input
          id="ai_base_url"
          value={settings['ai_base_url'] || ''}
          onChange={(e) => update('ai_base_url', e.target.value)}
          placeholder="https://api.openai.com/v1"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ai_sync_interval_minutes">Interval Sinkron Otomatis (menit)</Label>
        <Input
          id="ai_sync_interval_minutes"
          type="number"
          value={settings['ai_sync_interval_minutes'] || '30'}
          onChange={(e) => update('ai_sync_interval_minutes', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ai_prompt_summary">Prompt Ringkasan Kronologi</Label>
        <Textarea
          id="ai_prompt_summary"
          rows={4}
          value={settings['ai_prompt_summary'] || ''}
          onChange={(e) => update('ai_prompt_summary', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ai_prompt_satker">Prompt Ekstraksi Satker</Label>
        <Textarea
          id="ai_prompt_satker"
          rows={4}
          value={settings['ai_prompt_satker'] || ''}
          onChange={(e) => update('ai_prompt_satker', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ai_prompt_klasifikasi">Prompt Klasifikasi</Label>
        <Textarea
          id="ai_prompt_klasifikasi"
          rows={4}
          value={settings['ai_prompt_klasifikasi'] || ''}
          onChange={(e) => update('ai_prompt_klasifikasi', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ai_prompt_terlapor">Prompt Ekstraksi Terlapor</Label>
        <Textarea
          id="ai_prompt_terlapor"
          rows={4}
          value={settings['ai_prompt_terlapor'] || ''}
          onChange={(e) => update('ai_prompt_terlapor', e.target.value)}
        />
      </div>

      <div className="text-xs text-muted-foreground">
        API Key AI diatur melalui environment variable <code>AI_API_KEY</code>.
      </div>

      {testReply && (
        <div className="bg-muted p-3 rounded text-sm">
          <strong>Respons tes:</strong> {testReply}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </Button>
        <Button type="button" variant="outline" onClick={handleTest} disabled={isTesting}>
          {isTesting ? 'Menguji...' : 'Tes Koneksi AI'}
        </Button>
      </div>
    </form>
  )
}
