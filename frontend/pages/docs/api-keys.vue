<template>
  <div class="docs-page">
    <div class="page-header mb-4">
      <h1 class="h3 fw-bold mb-1"><i class="bi bi-journal-text me-2"></i>Using API Keys to Send WhatsApp</h1>
      <p class="text-muted mb-0">Panduan singkat menggunakan API Key untuk mengirim WhatsApp via Postman.</p>
    </div>

    <div class="card mb-4">
      <div class="card-header">
        <h5 class="mb-0"><i class="bi bi-1-circle me-2"></i>Buat API Key (tanpa login token)</h5>
      </div>
      <div class="card-body">
        <ol class="mb-0">
          <li>Buka menu <code>API Keys</code> → klik <strong>Create API Key</strong>.</li>
          <li>Isi <em>Name</em>, centang <em>Permissions</em> (minimal <code>read</code> dan <code>write</code>), tentukan <em>Rate Limit</em> bila perlu.</li>
          <li>Jika menggunakan arsitektur per‑device, gunakan tombol <strong>Token</strong> pada halaman <code>Devices</code> untuk mendapatkan <strong>API key</strong> yang terikat ke device.</li>
          <li>Simpan, lalu salin <strong>Full API Key</strong> (format: <code>wg_...</code>). Simpan di tempat aman.</li>
        </ol>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-header">
        <h5 class="mb-0"><i class="bi bi-2-circle me-2"></i>Siapkan Postman</h5>
      </div>
      <div class="card-body">
        <ol>
          <li>Buat request baru dengan metode <strong>POST</strong> ke endpoint:
            <pre class="code">{{ baseUrl }}/whatsapp/send-message</pre>
            <strong>PENTING:</strong> Gunakan endpoint <code>/whatsapp/send-message</code> dengan API key yang <u>terikat ke device</u>. Dengan API key seperti ini, <code>device_id</code> tidak perlu dikirim.
          </li>
          <li>Pada tab <em>Headers</em>, tambahkan:
            <pre class="code">Authorization: Bearer &lt;YOUR_API_KEY&gt;
Content-Type: application/json</pre>
          </li>
          <li>Pada tab <em>Body</em> pilih <strong>raw</strong> → <strong>JSON</strong>.
            <br/>Contoh kirim teks:
            <pre class="code">{
  "to": "62812xxxxxxx",
  "message": "Hello from Postman via API Key!"
}</pre>
            Contoh kirim media dari URL (tanpa field <code>type</code>):
            <pre class="code">{
  "to": "62812xxxxxxx",
  "media_url": "https://example.com/file.pdf",
  "message": "optional caption",
  "mime_type": "application/pdf",
  "file_name": "file.pdf"
}</pre>
            - Jika API key tidak terikat device, request akan ditolak; gunakan API key dari tombol Token di halaman Devices.
          </li>
          <li>Kirim request. Jika berhasil, server akan mengembalikan status <code>success: true</code> dan detail pengiriman.</li>
        </ol>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-header">
        <h5 class="mb-0"><i class="bi bi-3-circle me-2"></i>Cara Penggunaan (Quick Start)</h5>
      </div>
      <div class="card-body">
        <p class="mb-2">Header yang dipakai di semua contoh:</p>
        <pre class="code">Authorization: Bearer &lt;YOUR_API_KEY&gt;
Content-Type: application/json</pre>
        <p class="mb-2">Endpoints:</p>
        <pre class="code">POST {{ baseUrl }}/whatsapp/send-message        # Teks & Media
POST {{ baseUrl }}/whatsapp/send-interactive    # Template Buttons & List Message</pre>

        <strong>1) Kirim Teks</strong>
        <pre class="code">POST {{ baseUrl }}/whatsapp/send-message
{
  "to": "62812xxxxxxx",
  "message": "Hello dari API Key"
}</pre>

        <strong>2) Kirim Media dari URL</strong>
        <pre class="code">POST {{ baseUrl }}/whatsapp/send-message
{
  "to": "62812xxxxxxx",
  "media_url": "https://example.com/file.pdf",
  "message": "caption opsional",
  "mime_type": "application/pdf",
  "file_name": "file.pdf"
}</pre>

        <strong>3) Template Buttons</strong>
        <pre class="code">POST {{ baseUrl }}/whatsapp/send-interactive
{
  "to": "62812xxxxxxx",
  "message": "Pilih tindakan",
  "template_buttons": [
    { "index": 1, "urlButton": { "displayText": "Website", "url": "https://example.com" } },
    { "index": 2, "callButton": { "displayText": "Call Us", "phoneNumber": "+62123456789" } },
    { "index": 3, "quickReplyButton": { "displayText": "OK", "id": "ok-pressed" } }
  ]
}</pre>

        <strong>4) List Message</strong>
        <pre class="code">POST {{ baseUrl }}/whatsapp/send-interactive
{
  "to": "62812xxxxxxx",
  "list_message": {
    "title": "Menu",
    "text": "Silakan pilih",
    "button_text": "Pilih",
    "sections": [
      {
        "title": "Section 1",
        "rows": [
          { "title": "Item A", "rowId": "item-a", "description": "Deskripsi A" },
          { "title": "Item B", "rowId": "item-b" }
        ]
      }
    ]
  }
}</pre>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-header">
        <h5 class="mb-0"><i class="bi bi-4-circle me-2"></i>Contoh cURL</h5>
      </div>
      <div class="card-body">
        <pre class="code"># Teks
curl -X POST "{{ baseUrl }}/whatsapp/send-message" \
-H "Authorization: Bearer &lt;YOUR_API_KEY&gt;" \
-H "Content-Type: application/json" \
-d '{
  "to": "62812xxxxxxx",
  "message": "Hello from cURL via API Key!"
}'

# Media
curl -X POST "{{ baseUrl }}/whatsapp/send-message" \
-H "Authorization: Bearer &lt;YOUR_API_KEY&gt;" \
-H "Content-Type: application/json" \
-d '{
  "to": "62812xxxxxxx",
  "media_url": "https://example.com/file.pdf",
  "message": "optional caption",
  "mime_type": "application/pdf",
  "file_name": "file.pdf"
}'

# List Message
curl -X POST "{{ baseUrl }}/whatsapp/send-interactive" \
-H "Authorization: Bearer &lt;YOUR_API_KEY&gt;" \
-H "Content-Type: application/json" \
-d '{
  "to": "62812xxxxxxx",
  "list_message": {
    "title": "Menu",
    "text": "Silakan pilih",
    "button_text": "Pilih",
    "sections": [
      {
        "title": "Section 1",
        "rows": [
          { "title": "Item A", "rowId": "item-a", "description": "Deskripsi A" },
          { "title": "Item B", "rowId": "item-b" }
        ]
      }
    ]
  }
}'</pre>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h5 class="mb-0"><i class="bi bi-asterisk me-2"></i>Tips</h5>
      </div>
      <div class="card-body">
        <ul class="mb-0">
          <li>Pastikan <strong>Device</strong> status <em>Online</em> sebelum mengirim pesan.</li>
          <li>Jika mendapat 401/403, cek <em>Authorization</em> header atau permission API key.</li>
          <li>Gunakan API key yang terikat device agar tidak perlu mengirim <code>device_id</code>.</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const config = useRuntimeConfig()
const baseUrl = computed(() => config.public.apiBase)
</script>

<style scoped>
.docs-page { padding: 1.5rem; }
.page-header { background: white; padding: 1.25rem 1.5rem; border-radius: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,.06); }
.card { border: none; box-shadow: 0 2px 4px rgba(0,0,0,.06); border-radius: 1rem; }
.card-header { background: #f8f9fa; border-bottom: 1px solid #edf0f2; border-radius: 1rem 1rem 0 0 !important; }
.code { background: #0b1020; color: #e8f5ff; padding: 12px 14px; border-radius: 8px; overflow:auto; }
</style>

