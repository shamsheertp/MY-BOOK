import whatsappData from '../db/whatsapp.json';

export const getWhatsAppConfig = () => {
  const savedConfig = localStorage.getItem('whatsappConfig');
  if (savedConfig) {
    return JSON.parse(savedConfig);
  }
  return whatsappData.config;
};

export const getWhatsAppPreferences = () => {
  const savedPrefs = localStorage.getItem('whatsappPrefs');
  if (savedPrefs) {
    return JSON.parse(savedPrefs);
  }
  return whatsappData.preferences;
};

export const uploadWhatsAppMedia = async (blob, filename) => {
  const config = getWhatsAppConfig();
  if (!config || !config.apiKey || !config.phoneNumberId) {
    throw new Error("WhatsApp API is not configured properly.");
  }

  const formData = new FormData();
  formData.append('file', blob, filename);
  formData.append('messaging_product', 'whatsapp');

  const response = await fetch(`https://graph.facebook.com/v25.0/${config.phoneNumberId}/media`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: formData
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("WhatsApp Media Upload Error:", data);
    throw new Error(data.error?.message || "Failed to upload media");
  }
  return data.id;
};

export const sendWhatsAppMessage = async (to, message, type = 'template', mediaLinkOrId = null, filename = null) => {
  const config = getWhatsAppConfig();
  if (!config || !config.apiKey || !config.phoneNumberId) {
    throw new Error("WhatsApp API is not configured properly.");
  }
  
  // Format phone number to remove + or spaces if any
  const formattedTo = to.replace(/[^0-9]/g, '');

  let payload = {
    messaging_product: 'whatsapp',
    to: formattedTo,
  };

  if (type === 'template') {
    payload.type = 'template';
    payload.template = {
      name: 'hello_world',
      language: { code: 'en_US' }
    };
  } else if (type === 'document' && mediaLinkOrId) {
    payload.type = 'document';
    const isId = !mediaLinkOrId.startsWith('http');
    payload.document = {
      caption: message || "Here is your document.",
      filename: filename || "document.pdf"
    };
    if (isId) {
      payload.document.id = mediaLinkOrId;
    } else {
      payload.document.link = mediaLinkOrId;
    }
  } else {
    payload.type = 'text';
    payload.text = { body: message };
  }

  const response = await fetch(`https://graph.facebook.com/v25.0/${config.phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("WhatsApp API Error:", data);
    throw new Error(data.error?.message || "Failed to send message via API");
  }
  return data;
};

export const openWhatsAppFallback = (to, message) => {
  const formattedTo = to.replace(/[^0-9]/g, '');
  const url = `https://wa.me/${formattedTo}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};
