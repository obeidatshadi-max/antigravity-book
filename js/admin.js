const $ = id => document.getElementById(id);

async function init() {
  const { data: { session } } = await window.db.auth.getSession();
  if (session) showPanel();
}

$('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.password.value;
  const { error } = await window.db.auth.signInWithPassword({ email, password });
  if (error) {
    $('login-error').textContent = 'Invalid email or password.';
  } else {
    showPanel();
  }
});

$('logout-btn').addEventListener('click', async () => {
  await window.db.auth.signOut();
  $('admin-panel').style.display = 'none';
  $('login-screen').style.display = 'flex';
});

function showPanel() {
  $('login-screen').style.display = 'none';
  $('admin-panel').style.display = 'block';
  loadTab('reviews');
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    $('tab-' + tab).classList.add('active');
    loadTab(tab);
  });
});

function loadTab(tab) {
  const fns = { reviews: loadReviews, blog: loadBlog, dialogues: loadDialogues,
                'page-content': loadPageContent, leads: loadLeads, contacts: loadContacts };
  if (fns[tab]) fns[tab]();
}

function msg(container, text, isError) {
  const p = document.createElement('p');
  p.className = 'sb-msg';
  p.style.color = isError ? 'var(--danger)' : 'var(--success)';
  p.textContent = text;
  container.appendChild(p);
  setTimeout(() => p.remove(), 3000);
}

async function loadReviews() {
  const el = $('tab-reviews');
  const { data } = await window.db.from('reviews').select('*').order('display_order');
  el.innerHTML = `
    <div class="section-header">
      <h2>Reviews</h2>
      <button class="btn-primary" onclick="showReviewForm()">+ Add Review</button>
    </div>
    <div id="review-editor"></div>
    <table class="sb-table">
      <thead><tr><th>#</th><th>Author</th><th>Quote</th><th>Published</th><th></th></tr></thead>
      <tbody>${(data||[]).map(r => `
        <tr>
          <td>${r.display_order}</td>
          <td><strong>${r.author}</strong><br><span style="color:var(--muted)">${r.role||''}</span></td>
          <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">"${r.quote}"</td>
          <td><span class="badge ${r.published ? 'badge-green' : 'badge-grey'}">${r.published ? 'Live' : 'Draft'}</span></td>
          <td>
            <button class="btn-sm" onclick='editReview(${JSON.stringify(r)})'>Edit</button>
            <button class="btn-sm btn-danger" onclick="deleteReview('${r.id}')">Delete</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

function showReviewForm(r) {
  const el = $('review-editor');
  el.innerHTML = `
    <div class="editor-panel">
      <h3>${r ? 'Edit Review' : 'New Review'}</h3>
      <form class="sb-form" id="review-form">
        ${r ? `<input type="hidden" name="id" value="${r.id}">` : ''}
        <label>Author</label><input name="author" value="${r ? r.author : ''}" required>
        <label>Role / Title</label><input name="role" value="${r ? (r.role||'') : ''}">
        <label>Quote</label><textarea name="quote" required>${r ? r.quote : ''}</textarea>
        <label>Display Order</label><input type="number" name="display_order" value="${r ? r.display_order : 0}">
        <label>Published</label>
        <select name="published">
          <option value="true" ${(!r || r.published) ? 'selected' : ''}>Live</option>
          <option value="false" ${(r && !r.published) ? 'selected' : ''}>Draft</option>
        </select>
        <button type="submit">Save</button>
        <button type="button" onclick="$('review-editor').innerHTML=''" style="margin-left:0.5rem;background:none;border:1px solid var(--border);color:var(--muted);padding:0.4rem 0.8rem;border-radius:5px;">Cancel</button>
      </form>
    </div>`;
  $('review-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const row = {
      author: fd.get('author'), role: fd.get('role') || null,
      quote: fd.get('quote'), display_order: parseInt(fd.get('display_order')) || 0,
      published: fd.get('published') === 'true'
    };
    const id = fd.get('id');
    const { error } = id
      ? await window.db.from('reviews').update(row).eq('id', id)
      : await window.db.from('reviews').insert(row);
    if (error) { msg(el, 'Error: ' + error.message, true); }
    else { loadReviews(); }
  });
}
window.showReviewForm = showReviewForm;
window.editReview = (r) => showReviewForm(r);
window.deleteReview = async (id) => {
  if (!confirm('Delete this review?')) return;
  await window.db.from('reviews').delete().eq('id', id);
  loadReviews();
};

async function loadBlog() {
  const el = $('tab-blog');
  const { data } = await window.db.from('blog_posts').select('*').order('published_at', { ascending: false });
  el.innerHTML = `
    <div class="section-header">
      <h2>Blog Posts</h2>
      <button class="btn-primary" onclick="showPostForm()">+ New Post</button>
    </div>
    <div id="post-editor"></div>
    <table class="sb-table">
      <thead><tr><th>Title</th><th>Slug</th><th>Status</th><th></th></tr></thead>
      <tbody>${(data||[]).map(p => `
        <tr>
          <td>${p.title}</td>
          <td><code style="font-size:12px;color:var(--muted)">${p.slug}</code></td>
          <td><span class="badge ${p.published ? 'badge-green' : 'badge-grey'}">${p.published ? 'Live' : 'Draft'}</span></td>
          <td>
            <button class="btn-sm" onclick='editPost(${JSON.stringify(p).replace(/'/g, "&#39;")})'>Edit</button>
            <button class="btn-sm btn-danger" onclick="deletePost('${p.id}')">Delete</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

function showPostForm(p) {
  const el = $('post-editor');
  el.innerHTML = `
    <div class="editor-panel">
      <h3>${p ? 'Edit Post' : 'New Post'}</h3>
      <form class="sb-form" id="post-form">
        ${p ? `<input type="hidden" name="id" value="${p.id}">` : ''}
        <label>Title</label><input name="title" value="${p ? p.title : ''}" required>
        <label>Slug (URL)</label><input name="slug" value="${p ? p.slug : ''}" required placeholder="my-post-title">
        <label>Body (Markdown)</label><textarea name="body" style="min-height:240px">${p ? p.body : ''}</textarea>
        <label>Status</label>
        <select name="published">
          <option value="false" ${(!p || !p.published) ? 'selected' : ''}>Draft</option>
          <option value="true" ${(p && p.published) ? 'selected' : ''}>Live</option>
        </select>
        <button type="submit">Save</button>
        <button type="button" onclick="$('post-editor').innerHTML=''" style="margin-left:0.5rem;background:none;border:1px solid var(--border);color:var(--muted);padding:0.4rem 0.8rem;border-radius:5px;">Cancel</button>
      </form>
    </div>`;
  $('post-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const pub = fd.get('published') === 'true';
    const row = {
      title: fd.get('title'), slug: fd.get('slug'), body: fd.get('body'),
      published: pub, published_at: pub ? new Date().toISOString() : null
    };
    const id = fd.get('id');
    const { error } = id
      ? await window.db.from('blog_posts').update(row).eq('id', id)
      : await window.db.from('blog_posts').insert(row);
    if (error) { msg(el, 'Error: ' + error.message, true); }
    else { loadBlog(); }
  });
}
window.showPostForm = showPostForm;
window.editPost = (p) => showPostForm(p);
window.deletePost = async (id) => {
  if (!confirm('Delete this post?')) return;
  await window.db.from('blog_posts').delete().eq('id', id);
  loadBlog();
};

async function loadDialogues() {
  const el = $('tab-dialogues');
  const { data } = await window.db.from('dialogues').select('*').order('display_order');
  el.innerHTML = `
    <div class="section-header">
      <h2>Dialogues</h2>
      <button class="btn-primary" onclick="showDialogueForm()">+ Add Dialogue</button>
    </div>
    <div id="dialogue-editor"></div>
    <table class="sb-table">
      <thead><tr><th>#</th><th>Title</th><th>Published</th><th></th></tr></thead>
      <tbody>${(data||[]).map(d => `
        <tr>
          <td>${d.display_order}</td>
          <td>${d.title}</td>
          <td><span class="badge ${d.published ? 'badge-green' : 'badge-grey'}">${d.published ? 'Live' : 'Draft'}</span></td>
          <td>
            <button class="btn-sm" onclick='editDialogue(${JSON.stringify(d).replace(/'/g, "&#39;")})'>Edit</button>
            <button class="btn-sm btn-danger" onclick="deleteDialogue('${d.id}')">Delete</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

function showDialogueForm(d) {
  const el = $('dialogue-editor');
  el.innerHTML = `
    <div class="editor-panel">
      <h3>${d ? 'Edit Dialogue' : 'New Dialogue'}</h3>
      <form class="sb-form" id="dialogue-form">
        ${d ? `<input type="hidden" name="id" value="${d.id}">` : ''}
        <label>Title</label><input name="title" value="${d ? d.title : ''}" required>
        <label>Content (Markdown)</label><textarea name="content">${d ? d.content : ''}</textarea>
        <label>Display Order</label><input type="number" name="display_order" value="${d ? d.display_order : 0}">
        <label>Published</label>
        <select name="published">
          <option value="true" ${(!d || d.published) ? 'selected' : ''}>Live</option>
          <option value="false" ${(d && !d.published) ? 'selected' : ''}>Draft</option>
        </select>
        <button type="submit">Save</button>
        <button type="button" onclick="$('dialogue-editor').innerHTML=''" style="margin-left:0.5rem;background:none;border:1px solid var(--border);color:var(--muted);padding:0.4rem 0.8rem;border-radius:5px;">Cancel</button>
      </form>
    </div>`;
  $('dialogue-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const row = {
      title: fd.get('title'), content: fd.get('content'),
      display_order: parseInt(fd.get('display_order')) || 0,
      published: fd.get('published') === 'true'
    };
    const id = fd.get('id');
    const { error } = id
      ? await window.db.from('dialogues').update(row).eq('id', id)
      : await window.db.from('dialogues').insert(row);
    if (error) { msg(el, 'Error: ' + error.message, true); }
    else { loadDialogues(); }
  });
}
window.showDialogueForm = showDialogueForm;
window.editDialogue = (d) => showDialogueForm(d);
window.deleteDialogue = async (id) => {
  if (!confirm('Delete this dialogue?')) return;
  await window.db.from('dialogues').delete().eq('id', id);
  loadDialogues();
};

async function loadPageContent() {
  const el = $('tab-page-content');
  const { data } = await window.db.from('page_content').select('*').order('section').order('key');
  el.innerHTML = `
    <div class="section-header">
      <h2>Page Content</h2>
      <button class="btn-primary" onclick="showPageContentForm()">+ Add Key</button>
    </div>
    <div id="pc-editor"></div>
    <table class="sb-table">
      <thead><tr><th>Key</th><th>Section</th><th>Value</th><th></th></tr></thead>
      <tbody>${(data||[]).map(r => `
        <tr>
          <td><code style="font-size:12px">${r.key}</code></td>
          <td style="color:var(--muted)">${r.section||''}</td>
          <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.value}</td>
          <td>
            <button class="btn-sm" onclick='editPageContent(${JSON.stringify(r).replace(/'/g, "&#39;")})'>Edit</button>
            <button class="btn-sm btn-danger" onclick="deletePageContent('${r.key}')">Delete</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

function showPageContentForm(r) {
  const el = $('pc-editor');
  el.innerHTML = `
    <div class="editor-panel">
      <h3>${r ? 'Edit Content' : 'New Content Key'}</h3>
      <form class="sb-form" id="pc-form">
        <label>Key</label><input name="key" value="${r ? r.key : ''}" ${r ? 'readonly' : 'required'} placeholder="hero_tagline">
        <label>Section</label><input name="section" value="${r ? (r.section||'') : ''}" placeholder="hero">
        <label>Value</label><textarea name="value" style="min-height:80px">${r ? r.value : ''}</textarea>
        <button type="submit">Save</button>
        <button type="button" onclick="$('pc-editor').innerHTML=''" style="margin-left:0.5rem;background:none;border:1px solid var(--border);color:var(--muted);padding:0.4rem 0.8rem;border-radius:5px;">Cancel</button>
      </form>
    </div>`;
  $('pc-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const row = { key: fd.get('key'), value: fd.get('value'), section: fd.get('section') || null };
    const { error } = r
      ? await window.db.from('page_content').update({ value: row.value, section: row.section }).eq('key', r.key)
      : await window.db.from('page_content').insert(row);
    if (error) { msg(el, 'Error: ' + error.message, true); }
    else { loadPageContent(); }
  });
}
window.showPageContentForm = showPageContentForm;
window.editPageContent = (r) => showPageContentForm(r);
window.deletePageContent = async (key) => {
  if (!confirm('Delete this key?')) return;
  await window.db.from('page_content').delete().eq('key', key);
  loadPageContent();
};

async function loadLeads() {
  const el = $('tab-leads');
  const { data } = await window.db.from('leads').select('*').order('created_at', { ascending: false });
  const csv = ['email,name,source,created_at',
    ...(data||[]).map(r => `${r.email},${r.name||''},${r.source||''},${r.created_at}`)
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  el.innerHTML = `
    <div class="section-header">
      <h2>Leads <span style="color:var(--muted);font-size:0.85rem">(${(data||[]).length})</span></h2>
      <a href="${url}" download="leads.csv" class="btn-primary" style="text-decoration:none;padding:0.4rem 1rem">Export CSV</a>
    </div>
    <table class="sb-table">
      <thead><tr><th>Email</th><th>Name</th><th>Source</th><th>Date</th></tr></thead>
      <tbody>${(data||[]).map(r => `
        <tr>
          <td>${r.email}</td>
          <td>${r.name||'—'}</td>
          <td>${r.source||'—'}</td>
          <td style="color:var(--muted)">${new Date(r.created_at).toLocaleDateString()}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

async function loadContacts() {
  const el = $('tab-contacts');
  const { data } = await window.db.from('contacts').select('*').order('created_at', { ascending: false });
  el.innerHTML = `
    <div class="section-header">
      <h2>Contact Submissions <span style="color:var(--muted);font-size:0.85rem">(${(data||[]).length})</span></h2>
    </div>
    <table class="sb-table">
      <thead><tr><th>Name</th><th>Email</th><th>Message</th><th>Date</th><th></th></tr></thead>
      <tbody>${(data||[]).map(r => `
        <tr style="${!r.read ? 'font-weight:600' : ''}">
          <td>${r.name}</td>
          <td>${r.email}</td>
          <td style="max-width:280px;white-space:pre-wrap">${r.message}</td>
          <td style="color:var(--muted)">${new Date(r.created_at).toLocaleDateString()}</td>
          <td>${!r.read ? `<button class="btn-sm" onclick="markRead('${r.id}')">Mark read</button>` : '<span style="color:var(--muted);font-size:12px">Read</span>'}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

window.markRead = async (id) => {
  await window.db.from('contacts').update({ read: true }).eq('id', id);
  loadContacts();
};

init();
