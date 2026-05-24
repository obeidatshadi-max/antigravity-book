async function loadReviews() {
  const container = document.querySelector('[data-dynamic="reviews"]');
  if (!container) return;
  const { data, error } = await window.db
    .from('reviews')
    .select('*')
    .order('display_order');
  if (error || !data || data.length === 0) return;
  container.innerHTML = data.map(r => `
    <div style="margin-bottom:2rem;padding:1.5rem;border-left:3px solid var(--gold,#c9a84c);">
      <p style="font-style:italic;margin-bottom:0.5rem;">"${r.quote}"</p>
      <p><strong>${r.author}</strong>${r.role ? ` &mdash; ${r.role}` : ''}</p>
    </div>
  `).join('');
}

async function loadDialogues() {
  const container = document.querySelector('[data-dynamic="dialogues"]');
  if (!container) return;
  const { data, error } = await window.db
    .from('dialogues')
    .select('*')
    .order('display_order');
  if (error || !data || data.length === 0) return;
  const md = window.marked ? window.marked.parse : (s) => s;
  container.innerHTML = data.map(d => `
    <div style="margin-bottom:2rem;">
      <h3 style="margin-bottom:0.5rem;">${d.title}</h3>
      <div>${md(d.content)}</div>
    </div>
  `).join('');
}

async function loadPageContent() {
  const elements = document.querySelectorAll('[data-content-key]');
  if (elements.length === 0) return;
  const { data, error } = await window.db.from('page_content').select('key,value');
  if (error || !data) return;
  const map = Object.fromEntries(data.map(r => [r.key, r.value]));
  elements.forEach(el => {
    const val = map[el.dataset.contentKey];
    if (val) el.textContent = val;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadReviews();
  loadDialogues();
  loadPageContent();
});
