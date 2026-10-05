/* Printly DTF — Old School Client Window
 * Drop-in replacement for: client-quick-add-window.js
 * Uses the existing Supabase customers table.
 */
(() => {
  'use strict';

  const SUPABASE_URL = 'https://gfvvxwdbahakysxnwyxr.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_eyJrZXkiOiJjbGllbnQta2V5IiwidCI6ImdmdnZ4d2RiYWhha3lz eG53eXJxLnN1cGFiYXNlLmNvIn0'.replace(/\s/g, '');

  const api = async (path, options = {}) => {
    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...options,
      headers
    });

    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) {}

    if (!response.ok) {
      throw new Error(
        data?.message ||
        data?.error_description ||
        data?.hint ||
        text ||
        `Supabase error ${response.status}`
      );
    }

    return data;
  };

  const css = `
    #printly-old-client-overlay {
      position: fixed;
      inset: 0;
      z-index: 2147483000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(0,0,0,.62);
      font-family: Arial, Helvetica, sans-serif;
    }

    #printly-old-client-overlay.is-open {
      display: flex;
    }

    #printly-old-client-window {
      width: min(560px, 100%);
      max-height: min(760px, calc(100vh - 40px));
      overflow: auto;
      color: #111;
      background: #d7d7d7;
      border: 2px solid #111;
      box-shadow: 8px 8px 0 rgba(0,0,0,.45);
    }

    #printly-old-client-window .poc-titlebar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 10px;
      color: #fff;
      background: #222;
      border-bottom: 2px solid #111;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: .2px;
    }

    #printly-old-client-window .poc-close {
      width: 27px;
      height: 25px;
      padding: 0;
      border: 1px solid #fff;
      color: #fff;
      background: #444;
      cursor: pointer;
      font-size: 16px;
      line-height: 21px;
      font-weight: 700;
    }

    #printly-old-client-window .poc-body {
      padding: 18px;
    }

    #printly-old-client-window .poc-group {
      margin-bottom: 14px;
    }

    #printly-old-client-window label {
      display: block;
      margin-bottom: 5px;
      font-size: 13px;
      font-weight: 700;
    }

    #printly-old-client-window input {
      box-sizing: border-box;
      width: 100%;
      height: 38px;
      padding: 7px 9px;
      border: 1px solid #555;
      border-radius: 0;
      outline: none;
      color: #111;
      background: #fff;
      font: 14px Arial, Helvetica, sans-serif;
    }

    #printly-old-client-window input:focus {
      border: 2px solid #111;
      padding: 6px 8px;
    }

    #printly-old-client-window .poc-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 18px;
    }

    #printly-old-client-window button.poc-btn {
      min-height: 36px;
      padding: 7px 14px;
      border: 1px solid #333;
      border-radius: 2px;
      cursor: pointer;
      font: 700 13px Arial, Helvetica, sans-serif;
    }

    #printly-old-client-window .poc-cancel {
      color: #111;
      background: #eee;
    }

    #printly-old-client-window .poc-save {
      color: #fff;
      background: #8f0000;
      border-color: #5e0000;
    }

    #printly-old-client-window .poc-save:disabled {
      opacity: .55;
      cursor: wait;
    }

    #printly-old-client-window .poc-message {
      min-height: 18px;
      margin-top: 10px;
      font-size: 12px;
      font-weight: 700;
    }

    #printly-old-client-window .poc-list-title {
      margin: 22px 0 7px;
      padding-bottom: 5px;
      border-bottom: 1px solid #777;
      font-size: 13px;
      font-weight: 700;
    }

    #printly-old-client-window .poc-list {
      max-height: 220px;
      overflow: auto;
      border: 1px solid #888;
      background: #eee;
    }

    #printly-old-client-window .poc-client {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 9px;
      border-bottom: 1px solid #c3c3c3;
      font-size: 12px;
    }

    #printly-old-client-window .poc-client:last-child {
      border-bottom: 0;
    }

    #printly-old-client-window .poc-client-name {
      font-weight: 700;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    #printly-old-client-window .poc-client-phone {
      flex: 0 0 auto;
      color: #555;
      white-space: nowrap;
    }

    #printly-old-client-window .poc-empty {
      padding: 14px;
      color: #555;
      text-align: center;
      font-size: 12px;
    }

    @media (max-width: 560px) {
      #printly-old-client-overlay {
        padding: 8px;
      }

      #printly-old-client-window {
        max-height: calc(100vh - 16px);
      }

      #printly-old-client-window .poc-body {
        padding: 14px;
      }

      #printly-old-client-window .poc-actions {
        flex-direction: column-reverse;
      }

      #printly-old-client-window button.poc-btn {
        width: 100%;
      }

      #printly-old-client-window .poc-client {
        align-items: flex-start;
        flex-direction: column;
        gap: 3px;
      }
    }
  `;

  function injectStyle() {
    if (document.getElementById('printly-old-client-style')) return;
    const style = document.createElement('style');
    style.id = 'printly-old-client-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function buildUI() {
    if (document.getElementById('printly-old-client-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'printly-old-client-overlay';
    overlay.innerHTML = `
      <div id="printly-old-client-window" role="dialog" aria-modal="true" aria-label="Nouveau client">
        <div class="poc-titlebar">
          <span>PRINTLY DTF — Nouveau client</span>
          <button class="poc-close" type="button" aria-label="Fermer">×</button>
        </div>

        <div class="poc-body">
          <form id="poc-form" autocomplete="off">
            <div class="poc-group">
              <label for="poc-name">Nom / Société *</label>
              <input id="poc-name" name="name" type="text" maxlength="150" required
                     placeholder="Ex. Ahmed Design">
            </div>

            <div class="poc-group">
              <label for="poc-phone">Téléphone *</label>
              <input id="poc-phone" name="phone" type="tel" maxlength="40" required
                     placeholder="Ex. 0550 00 00 00">
            </div>

            <div class="poc-message" id="poc-message" aria-live="polite"></div>

            <div class="poc-actions">
              <button class="poc-btn poc-cancel" type="button" id="poc-cancel">Annuler</button>
              <button class="poc-btn poc-save" type="submit" id="poc-save">Ajouter le client</button>
            </div>
          </form>

          <div class="poc-list-title">Clients existants</div>
          <div class="poc-list" id="poc-list">
            <div class="poc-empty">Chargement...</div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => {
      overlay.classList.remove('is-open');
      document.body.style.removeProperty('overflow');
    };

    overlay.querySelector('.poc-close').addEventListener('click', close);
    overlay.querySelector('#poc-cancel').addEventListener('click', close);

    overlay.addEventListener('mousedown', (event) => {
      if (event.target === overlay) close();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && overlay.classList.contains('is-open')) close();
    });

    overlay.querySelector('#poc-form').addEventListener('submit', handleSubmit);

    window.__printlyOldClientUI = {
      overlay,
      open,
      close,
      refresh: loadClients
    };
  }

  function setMessage(message, type = 'normal') {
    const el = document.getElementById('poc-message');
    if (!el) return;

    el.textContent = message;
    el.style.color =
      type === 'error' ? '#9b0000' :
      type === 'success' ? '#087300' :
      '#333';
  }

  async function loadClients() {
    const list = document.getElementById('poc-list');
    if (!list) return;

    list.innerHTML = '<div class="poc-empty">Chargement...</div>';

    try {
      const clients = await api(
        'customers?select=id,full_name,phone&order=full_name.asc&limit=100'
      );

      if (!Array.isArray(clients) || clients.length === 0) {
        list.innerHTML = '<div class="poc-empty">Aucun client enregistré.</div>';
        return;
      }

      list.innerHTML = clients.map(client => `
        <div class="poc-client">
          <span class="poc-client-name">${escapeHtml(client.full_name || 'Sans nom')}</span>
          <span class="poc-client-phone">${escapeHtml(client.phone || '')}</span>
        </div>
      `).join('');
    } catch (error) {
      console.error('[Printly Old Client]', error);
      list.innerHTML =
        '<div class="poc-empty">Impossible de charger les clients.</div>';
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const nameInput = form.querySelector('#poc-name');
    const phoneInput = form.querySelector('#poc-phone');
    const saveButton = form.querySelector('#poc-save');

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!name) {
      setMessage('Le nom / société est obligatoire.', 'error');
      nameInput.focus();
      return;
    }

    if (!phone) {
      setMessage('Le téléphone est obligatoire.', 'error');
      phoneInput.focus();
      return;
    }

    saveButton.disabled = true;
    setMessage('Vérification...', 'normal');

    try {
      // Duplicate check by phone.
      const encodedPhone = encodeURIComponent(phone);
      const existing = await api(
        `customers?select=id,full_name,phone&phone=eq.${encodedPhone}&limit=1`
      );

      if (Array.isArray(existing) && existing.length > 0) {
        setMessage(
          `Ce numéro existe déjà pour « ${existing[0].full_name || 'ce client'} ».`,
          'error'
        );
        phoneInput.focus();
        return;
      }

      setMessage('Création du client...', 'normal');

      const created = await api('customers', {
        method: 'POST',
        headers: {
          Prefer: 'return=representation'
        },
        body: JSON.stringify({
          full_name: name,
          phone: phone
        })
      });

      const client = Array.isArray(created) ? created[0] : created;

      setMessage('Client ajouté avec succès.', 'success');

      // Notify the rest of Printly DTF so New Command / client selectors
      // can refresh without changing the existing Clients screen.
      window.dispatchEvent(new CustomEvent('pcc-data-changed', {
        detail: {
          type: 'customer-created',
          customer: client || { full_name: name, phone }
        }
      }));

      window.dispatchEvent(new Event('customers-updated'));

      await loadClients();

      form.reset();
      nameInput.focus();
    } catch (error) {
      console.error('[Printly Old Client]', error);

      const message = String(error?.message || error);
      if (/duplicate|unique/i.test(message)) {
        setMessage('Ce client existe déjà.', 'error');
      } else {
        setMessage(`Erreur: ${message}`, 'error');
      }
    } finally {
      saveButton.disabled = false;
    }
  }

  function open() {
    injectStyle();
    buildUI();

    const overlay = document.getElementById('printly-old-client-overlay');
    if (!overlay) return;

    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    setMessage('');
    loadClients();

    setTimeout(() => {
      document.getElementById('poc-name')?.focus();
    }, 30);
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function isNewClientButton(element) {
    if (!element || !(element instanceof Element)) return false;

    const text = [
      element.textContent,
      element.getAttribute('aria-label'),
      element.getAttribute('title')
    ].filter(Boolean).join(' ').trim();

    return /nouveau\s+client/i.test(text);
  }

  function hookButtons(root = document) {
    const elements = root.querySelectorAll
      ? root.querySelectorAll('button, a, [role="button"]')
      : [];

    elements.forEach(element => {
      if (!isNewClientButton(element) || element.dataset.printlyOldClientHooked === '1') {
        return;
      }

      element.dataset.printlyOldClientHooked = '1';

      element.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        open();
      }, true);
    });
  }

  function init() {
    injectStyle();
    buildUI();
    hookButtons();

    // Catch buttons rendered later by React/other UI code.
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            hookButtons(node);
          }
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Public API for New Command or any other Printly component.
    window.__printlyOpenOldClient = open;
    window.__printlyOldClient = {
      open,
      close: () => window.__printlyOldClientUI?.close(),
      refresh: loadClients
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
