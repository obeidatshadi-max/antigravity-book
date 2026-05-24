function showMsg(form, text, isError) {
  let el = form.querySelector('.sb-msg');
  if (!el) {
    el = document.createElement('p');
    el.className = 'sb-msg';
    el.style.cssText = 'margin-top:0.5rem;font-size:0.9rem;';
    form.appendChild(el);
  }
  el.textContent = text;
  el.style.color = isError ? '#e53e3e' : '#38a169';
}

async function handleEmailCapture(form) {
  const email = form.querySelector('[name="email"]').value.trim();
  const nameEl = form.querySelector('[name="name"]');
  const name = nameEl ? nameEl.value.trim() || null : null;
  const source = form.dataset.source || 'unknown';
  const { error } = await window.db.from('leads').insert({ email, name, source });
  return error;
}

async function handleContact(form) {
  const name = form.querySelector('[name="name"]').value.trim();
  const email = form.querySelector('[name="email"]').value.trim();
  const message = form.querySelector('[name="message"]').value.trim();
  const { error } = await window.db.from('contacts').insert({ name, email, message });
  return error;
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form[data-type="email-capture"]').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      const prev = btn.textContent;
      btn.textContent = '...';
      const error = await handleEmailCapture(form);
      if (error) {
        const msg = error.code === '23505'
          ? "You're already on the list!"
          : 'Something went wrong. Please try again.';
        showMsg(form, msg, error.code !== '23505');
      } else {
        showMsg(form, "Thank you! You're on the list.", false);
        form.reset();
      }
      btn.disabled = false;
      btn.textContent = prev;
    });
  });

  const contactForm = document.querySelector('form[data-type="contact"]');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      const prev = btn.textContent;
      btn.textContent = '...';
      const error = await handleContact(contactForm);
      if (error) {
        showMsg(contactForm, 'Something went wrong. Please try again.', true);
      } else {
        showMsg(contactForm, "Message sent! We'll be in touch.", false);
        contactForm.reset();
      }
      btn.disabled = false;
      btn.textContent = prev;
    });
  }
});
