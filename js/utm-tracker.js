/**
 * UTM Tracker - Captura e armazena parâmetros UTM para tracking
 * Este script deve ser incluído em todas as páginas do site
 */

(function() {
    'use strict';
    
    // Função para capturar parâmetros UTM da URL
    function captureUTMParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const utmData = {
            utm_source: urlParams.get('utm_source') || '',
            utm_campaign: urlParams.get('utm_campaign') || '',
            utm_medium: urlParams.get('utm_medium') || '',
            utm_content: urlParams.get('utm_content') || '',
            utm_term: urlParams.get('utm_term') || '',
            xcod: urlParams.get('xcod') || '',
            sck: urlParams.get('sck') || '',
            timestamp: new Date().toISOString(),
            page: window.location.pathname
        };
        
        // Verificar se há pelo menos um parâmetro UTM na URL
        const hasUTMParams = Object.keys(utmData).some(key => 
            key !== 'timestamp' && key !== 'page' && utmData[key] !== ''
        );
        
        if (hasUTMParams) {
            // Salvar no localStorage apenas se há parâmetros UTM
            localStorage.setItem('utm_tracking_data', JSON.stringify(utmData));
            console.log('UTM parameters captured and saved:', utmData);
        } else {
            // Se não há parâmetros UTM na URL atual, verificar se já existem dados salvos
            const existingData = localStorage.getItem('utm_tracking_data');
            if (existingData) {
                console.log('Using existing UTM data:', JSON.parse(existingData));
            } else {
                console.log('No UTM parameters found in URL and no existing data');
            }
        }
        
        return utmData;
    }
    
    // Função para obter dados de tracking do localStorage
    function getTrackingData() {
        const savedData = localStorage.getItem('utm_tracking_data');
        if (savedData) {
            return JSON.parse(savedData);
        }
        
        // Se não há dados salvos, retornar objeto vazio
        return {
            utm_source: '',
            utm_campaign: '',
            utm_medium: '',
            utm_content: '',
            utm_term: '',
            xcod: '',
            sck: ''
        };
    }
    
    // Função para limpar dados de tracking (útil após conversão)
    function clearTrackingData() {
        localStorage.removeItem('utm_tracking_data');
        console.log('UTM tracking data cleared');
    }
    
    // Executar captura quando a página carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', captureUTMParameters);
    } else {
        captureUTMParameters();
    }
    
    // Expor funções globalmente para uso em outras partes do site
    window.UTMTracker = {
        capture: captureUTMParameters,
        get: getTrackingData,
        clear: clearTrackingData
    };
    
})();