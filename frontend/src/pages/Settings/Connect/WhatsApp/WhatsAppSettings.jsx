import React, { useState, useEffect, useCallback } from 'react';
import whatsappData from '../../../../db/whatsapp.json';
import { sendWhatsAppMessage } from '../../../../hooks/useWhatsApp';

// Import newly refactored components
import { WhatsAppHeader } from './components/WhatsAppHeader';
import { SecurityConfig } from './components/SecurityConfig';
import { NotificationPreferences } from './components/NotificationPreferences';
import { MessagePreview } from './components/MessagePreview';

/**
 * Main WhatsAppSettings Component
 * Acts as the smart container managing state and layout for WhatsApp settings.
 */
export default function WhatsAppSettings() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [config, setConfig] = useState(whatsappData.config || {
    apiKey: '', phoneNumberId: '', businessAccountId: '',
  });

  const [preferences, setPreferences] = useState(whatsappData.preferences || {
    sendInvoices: true, sendReceipts: true, sendReminders: false, sharePdf: true, sharePictures: true,
  });

  useEffect(() => {
    // Only fetch from localStorage once on mount to avoid the lint warning
    const loadData = () => {
      const savedConfig = localStorage.getItem('whatsappConfig');
      const savedPrefs = localStorage.getItem('whatsappPrefs');
      
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
        setIsConfigured(true);
      } else if (whatsappData.config && whatsappData.config.apiKey) {
        setIsConfigured(true);
      }

      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }
    };
    
    loadData();
  }, []);

  const handleConfigChange = useCallback((e) => {
    setConfig(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handlePrefChange = useCallback((e) => {
    setPreferences(prev => ({ ...prev, [e.target.name]: e.target.checked }));
  }, []);

  const handleSaveConfig = useCallback(() => {
    if (!config.apiKey || !config.phoneNumberId) return;
    localStorage.setItem('whatsappConfig', JSON.stringify(config));
    localStorage.setItem('whatsappPrefs', JSON.stringify(preferences));
    setIsConfigured(true);
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, [config, preferences]);

  const handleDeleteConfig = useCallback(() => {
    if (window.confirm("Are you sure you want to delete the WhatsApp configuration? This stops all automated messages.")) {
      localStorage.removeItem('whatsappConfig');
      setConfig({ apiKey: '', phoneNumberId: '', businessAccountId: '' });
      setIsConfigured(false);
      setIsEditing(false);
    }
  }, []);

  const handleTest = useCallback(async (testPhone) => {
    await sendWhatsAppMessage(testPhone, "Hello from your App! This is a test message to verify your WhatsApp API integration is working correctly.");
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <WhatsAppHeader isConfigured={isConfigured} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <SecurityConfig 
            config={config} 
            isConfigured={isConfigured} 
            isEditing={isEditing}
            onChange={handleConfigChange}
            onSave={handleSaveConfig}
            onEdit={() => setIsEditing(true)}
            onCancel={() => setIsEditing(false)}
            onDelete={handleDeleteConfig}
            onTest={handleTest}
          />

          <NotificationPreferences 
            isConfigured={isConfigured}
            preferences={preferences}
            onChange={handlePrefChange}
            onSave={handleSaveConfig}
            saved={saved}
          />
        </div>

        <MessagePreview preferences={preferences} />
      </div>
    </div>
  );
}
