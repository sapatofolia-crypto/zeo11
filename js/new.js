// Classe para gerenciar os prêmios da roleta
class PrizeManager {
  constructor(prizes) {
    this.prizes = prizes || [];
    this.blockedPrizes = ['Combo Casal gratuito']; // Prêmios que nunca devem ser sorteados
  }

  // Adicionar um prêmio à lista de bloqueados
  blockPrize(prizeName) {
    if (!this.blockedPrizes.includes(prizeName)) {
      this.blockedPrizes.push(prizeName);
    }
  }

  // Remover um prêmio da lista de bloqueados
  unblockPrize(prizeName) {
    this.blockedPrizes = this.blockedPrizes.filter(name => name !== prizeName);
  }

  // Obter um prêmio aleatório, excluindo os bloqueados
  getRandomPrize() {
    // Filtra os prêmios bloqueados
    const allowedPrizes = this.prizes.filter(prize => !this.blockedPrizes.includes(prize.name));
    
    // Retorna um prêmio aleatório entre os disponíveis
    if (allowedPrizes.length > 0) {
      const index = Math.floor(Math.random() * allowedPrizes.length);
      return allowedPrizes[index];
    }
    
    // Fallback caso todos os prêmios estejam bloqueados
    return { name: 'Tente Novamente', icon: '', color: '#222222' };
  }

  // Bloquear o último elemento da lista de prêmios
  blockLastPrize() {
    if (this.prizes.length > 0) {
      const lastPrize = this.prizes[this.prizes.length - 1];
      this.blockPrize(lastPrize.name);
    }
  }

  // Obter índice de um prêmio na lista completa
  getPrizeIndex(prizeName) {
    return this.prizes.findIndex(prize => prize.name === prizeName);
  }
}

// Classe para gerenciar a roleta
class RouletteManager {
  constructor(config) {
    this.prizeManager = new PrizeManager(config.prizes);
    this.elements = this.initElements();
    this.state = {
      isSpinning: false,
      currentRotation: 0,
      resizeTimer: null
    };
    
    // Bloquear o último prêmio conforme solicitado
    this.prizeManager.blockLastPrize();
    
    this.initialize();
  }

  // Inicializa os elementos do DOM
  initElements() {
    return {
      rouletteModal: document.getElementById('roulette-modal-container'),
      wheel: document.getElementById('wheel'),
      spinButton: document.getElementById('spin-button'),
      prizeModal: document.getElementById('prize-modal'),
      prizeModalTitle: document.getElementById('prize-modal-title'),
      prizeWonText: document.getElementById('prize-won-text'),
      collectPrizeBtn: document.getElementById('collect-prize-btn'),
      closeRouletteBtn: document.getElementById('close-roulette-modal-btn'),
      toast: document.getElementById('toast'),
      toastDescription: document.getElementById('toast-description'),
      confettiContainer: document.getElementById('confetti-container')
    };
  }

  // Inicializa os eventos da roleta
  initialize() {
    if (!this.validateElements()) {
      console.error("Elementos essenciais da roleta não encontrados!");
      return;
    }

    // Configura eventos para fechar o modal
    if (this.elements.closeRouletteBtn) {
      this.elements.closeRouletteBtn.addEventListener('click', () => {
        this.elements.rouletteModal.style.display = 'none';
        this.resetWheelState();
      });
    }

    // Fecha o modal da roleta clicando fora
    this.elements.rouletteModal.addEventListener('click', (event) => {
      if (event.target === this.elements.rouletteModal) {
        this.elements.rouletteModal.style.display = 'none';
        this.resetWheelState();
      }
    });

    // Configura os eventos para girar e coletar prêmio
    this.elements.spinButton.addEventListener('click', () => this.spinWheel());
    
    if (this.elements.collectPrizeBtn) {
      this.elements.collectPrizeBtn.addEventListener('click', () => this.closePrizeModal());
      
      if (this.elements.closeRouletteBtn) {
        this.elements.closeRouletteBtn.addEventListener('click', () => {
          this.elements.rouletteModal.style.display = 'none';
          this.resetWheelState();
        });
      }
    }

    // Recria a roleta quando a janela é redimensionada
    window.addEventListener('resize', () => {
      clearTimeout(this.state.resizeTimer);
      this.state.resizeTimer = setTimeout(() => {
        if (this.elements.rouletteModal.style.display === 'flex' && !this.state.isSpinning) {
          this.createWheel();
        }
      }, 200);
    });

    // Expõe métodos para uso global
    window.resetWheelState = () => this.resetWheelState();
    window.createWheel = () => this.createWheel();
  }

  // Valida se todos os elementos necessários estão disponíveis
  validateElements() {
    return this.elements.wheel && 
           this.elements.spinButton && 
           this.elements.prizeModal && 
           this.elements.rouletteModal;
  }

  // Cria a roleta com os segmentos e textos
  createWheel() {
    const wheel = this.elements.wheel;
    if (!wheel) return;
    
    wheel.innerHTML = ''; // Limpa a roleta
    const prizes = this.prizeManager.prizes;
    const segmentAngle = 360 / prizes.length;
    
    // Cria o fundo da roleta com gradiente cônico
    let gradient = 'conic-gradient(';
    prizes.forEach((prize, index) => {
      const startAngle = index * segmentAngle;
      const endAngle = (index + 1) * segmentAngle;
      gradient += `${prize.color} ${startAngle}deg ${endAngle}deg${index < prizes.length - 1 ? ', ' : ''}`;
    });
    gradient += ')';
    wheel.style.background = gradient;
    
    // Adiciona os textos dos prêmios em orientação radial
    prizes.forEach((prize, index) => {
      // Ângulo médio do segmento em radianos
      const segmentMidAngle = (index * segmentAngle + segmentAngle / 2) * Math.PI / 180;
      
      // Cria o elemento de texto
      const text = document.createElement('div');
      text.className = 'segment-text';
      text.innerHTML = `${prize.icon || ''} ${prize.name}`;
      
      // Posição no círculo - Ajustado para ficar centralizado no segmento
      const wheelRadius = wheel.offsetWidth / 2;
      // Posicionando o texto no meio do raio (50% entre centro e borda)
      const midRadius = wheelRadius * 0.5; // 50% do raio para centralizar o texto
      
      // Calcula posição X,Y para o meio do segmento
      const midX = midRadius * Math.cos(segmentMidAngle - Math.PI/2);
      const midY = midRadius * Math.sin(segmentMidAngle - Math.PI/2);
      
      // Aplicando a transformação radial
      text.style.transformOrigin = 'center'; // Ponto de origem para a rotação
      text.style.transform = `
        translate(-50%, -50%)
        translate(${midX}px, ${midY}px)
        rotate(${(index * segmentAngle + segmentAngle / 2) - 90}deg)
      `;
      
      // Ajustando estilos para texto radial centralizado
      text.style.width = '90px'; // Comprimento do texto no raio
      text.style.height = '25px'; // Altura fixa para o texto
      text.style.fontSize = '13px'; // Fonte um pouco maior
      text.style.textAlign = 'center';
      text.style.whiteSpace = 'nowrap'; // Sem quebra de linha em orientação radial
      text.style.display = 'flex';
      text.style.alignItems = 'center';
      text.style.justifyContent = 'center';
      text.style.textWrap = 'wrap';
      
      wheel.appendChild(text);
    });
    
    this.adjustTextSizeBasedOnViewport();
  }

  // Ajusta o tamanho do texto baseado no tamanho da tela
  adjustTextSizeBasedOnViewport() {
    const viewportWidth = window.innerWidth;
    const textElements = document.querySelectorAll('.segment-text');
    
    if (viewportWidth < 400) {
      textElements.forEach(text => {
        text.style.fontSize = '11px';
      });
    } else if (viewportWidth < 600) {
      textElements.forEach(text => {
        text.style.fontSize = '12px';
      });
    } else {
      textElements.forEach(text => {
        text.style.fontSize = '14px';
      });
    }
  }

  // Gira a roleta
  spinWheel() {
    if (this.state.isSpinning || !this.elements.wheel) return;
    
    this.state.isSpinning = true;
    this.elements.spinButton.disabled = true;
    this.elements.spinButton.textContent = 'Girando...';
    this.elements.spinButton.classList.remove('animate-pulse');
    
    // Seleciona prêmio aleatório
    const winningPrize = this.prizeManager.getRandomPrize();
    const winningSegmentIndex = this.prizeManager.getPrizeIndex(winningPrize.name);
    
    // Calcula rotação para o prêmio selecionado
    const segmentAngle = 360 / this.prizeManager.prizes.length;
    const targetAngle = 360 - ((winningSegmentIndex * segmentAngle) + (segmentAngle / 2));
    const randomOffset = (Math.random() - 0.5) * segmentAngle * 0.8; // Variação dentro do segmento
    const fullSpins = 6 + Math.floor(Math.random() * 3); // 6 a 8 rotações completas
    const totalRotation = (fullSpins * 360) + targetAngle + randomOffset;
    
    // Atualiza rotação atual
    const finalRotation = this.state.currentRotation + totalRotation;
    this.state.currentRotation = finalRotation;
    
    // Aplica a rotação
    this.elements.wheel.style.transform = `rotate(${finalRotation}deg)`;
    
    // Após a animação terminar
    setTimeout(() => {
      this.state.isSpinning = false;
      this.elements.spinButton.disabled = false;
      this.elements.spinButton.textContent = 'GIRAR NOVAMENTE!';
      this.elements.spinButton.classList.add('animate-pulse');
      
      // Mostra prêmio ganho
      this.showToast(`Você ganhou ${winningPrize.name}!`);
      this.createConfetti();
      
      // Atualiza e mostra o modal de prêmio
      if (this.elements.prizeModalTitle && this.elements.prizeWonText) {
        this.elements.prizeModalTitle.textContent = 'PARABÉNS!';
        this.elements.prizeWonText.innerHTML = `${winningPrize.icon || ''} ${winningPrize.name}`;
        this.showPrizeModal();
      }
      
      // Salvar informação do prêmio ganho
      this.savePrizeInfo(winningPrize.name);
      
      // Configura um temporizador para recarregar a página após o modal de prêmio ser exibido
      setTimeout(() => {
        // Apenas recarrega se o modal de prêmio estiver visível
        // Isso permite que o usuário veja a animação e o prêmio antes do reload
        if (this.elements.prizeModal && this.elements.prizeModal.classList.contains('show')) {
          window.location.reload();
        }
      }, 3000); // 3 segundos após exibir o prêmio
    }, 5500);
  }

  // Exibe uma mensagem de toast
  showToast(message) {
    if (!this.elements.toast || !this.elements.toastDescription) return;
    this.elements.toastDescription.textContent = message;
    this.elements.toast.classList.add('show');
    setTimeout(() => this.elements.toast.classList.remove('show'), 4500);
  }

  // Mostra o modal com o prêmio
  showPrizeModal() {
    if (!this.elements.prizeModal) return;
    this.elements.prizeModal.classList.add('show');
  }

  // Fecha o modal do prêmio
  closePrizeModal() {
    if (!this.elements.prizeModal) return;
    this.elements.prizeModal.classList.remove('show');
    
    // Fechar também o modal da roleta
    if (this.elements.rouletteModal) {
      this.elements.rouletteModal.style.display = 'none';
    }
    
    // Remover o canvas de confetti
    const confettiCanvas = document.getElementById('confetti-canvas');
    if (confettiCanvas && confettiCanvas.parentNode) {
      confettiCanvas.parentNode.removeChild(confettiCanvas);
    }
    
    // Mostrar o prêmio na interface principal (opcional)
    this.showPrizeOnMainUI();
    
    // Recarregar a página para exibir o prêmio no header
    window.location.reload();
  }

  // Reseta o estado da roleta
  resetWheelState() {
    if (this.elements.wheel) {
      this.elements.wheel.style.transition = 'none';
      this.state.currentRotation = this.state.currentRotation % 360; // Mantém apenas a posição atual
      this.elements.wheel.style.transform = `rotate(${this.state.currentRotation}deg)`;
      setTimeout(() => {
        this.elements.wheel.style.transition = 'transform 5.5s cubic-bezier(0.15, 0.75, 0.25, 1)';
      }, 10);
    }
    
    if (this.elements.spinButton) {
      this.state.isSpinning = false;
      this.elements.spinButton.disabled = false;
      this.elements.spinButton.textContent = 'GIRAR AGORA!';
      this.elements.spinButton.classList.add('animate-pulse');
    }
    
    this.closePrizeModal();
    if (this.elements.confettiContainer) this.elements.confettiContainer.innerHTML = '';
  }

  // Cria confetti para celebração
  createConfetti() {
    // Verificar se o canvas já existe e removê-lo se necessário
    const existingCanvas = document.getElementById('confetti-canvas');
    if (existingCanvas) {
      existingCanvas.parentNode.removeChild(existingCanvas);
    }
    
    // Criar e configurar o canvas para o confetti
    const canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);
    
    // Criar a instância do confetti
    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: true
    });
    
    // Definir duração e cores
    const duration = 5 * 1000;
    const end = Date.now() + duration;
    const colors = ['#e63946', '#fcbf49', '#f4a261', '#a97c50', '#2a9d8f', '#e9c46a'];
    
    // Função para disparar confetti
    const frame = () => {
      // Disparar confetti do lado esquerdo
      myConfetti({
        particleCount: 5,
        angle: 60,
        spread: 75,
        origin: { x: 0, y: 0.5 },
        colors: colors,
        shapes: ['circle', 'square'],
        zIndex: 100
      });
      
      // Disparar confetti do lado direito
      myConfetti({
        particleCount: 5,
        angle: 120,
        spread: 75,
        origin: { x: 1, y: 0.5 },
        colors: colors,
        shapes: ['circle', 'square'],
        zIndex: 100
      });
      
      // Disparar confetti do topo
      myConfetti({
        particleCount: 3,
        angle: 90,
        spread: 70,
        origin: { x: 0.5, y: 0 },
        colors: colors,
        shapes: ['circle', 'square'],
        zIndex: 100
      });
      
      // Continuar disparando enquanto estiver dentro da duração
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    
    // Iniciar a animação
    frame();
    
    // Disparar explosão inicial de confetti
    myConfetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: colors,
      zIndex: 100
    });
  }

  // Salva informações do prêmio ganho
  savePrizeInfo(prizeName) {
    localStorage.setItem('rouletteWon', 'true');
    localStorage.setItem('roulettePrize', prizeName);
    localStorage.setItem('rouletteDate', new Date().toISOString());
    
    // Também define um cookie como backup
    setCookie('rouletteWon', 'true', 30); // Cookie válido por 30 dias
    
    // Atualiza o display do prêmio no header, se a função existir
    if (typeof updatePrizeDisplay === 'function') {
      updatePrizeDisplay('#prize-display');
    }
  }

  // Mostra o prêmio na interface principal (opcional)
  showPrizeOnMainUI() {
    const prize = localStorage.getItem('roulettePrize');
    if (prize) {
      // Implementação para mostrar o prêmio na interface principal
      console.log("Prêmio salvo:", prize);
    }
  }
}

// Mapeamento de estados e suas siglas
const estados = {
  "Rondônia": "RO", "Acre": "AC", "Amazonas": "AM", "Roraima": "RR", "Pará": "PA",
  "Amapá": "AP", "Tocantins": "TO", "Maranhão": "MA", "Piauí": "PI", "Ceará": "CE",
  "Rio Grande do Norte": "RN", "Paraíba": "PB", "Pernambuco": "PE", "Alagoas": "AL", "Sergipe": "SE",
  "Bahia": "BA", "Minas Gerais": "MG", "Espírito Santo": "ES", "Rio de Janeiro": "RJ", "São Paulo": "SP",
  "Paraná": "PR", "Santa Catarina": "SC", "Rio Grande do Sul": "RS", "Mato Grosso do Sul": "MS", "Mato Grosso": "MT",
  "Goiás": "GO", "Distrito Federal": "DF"
};

// Funções utilitárias

// Verifica se o usuário já ganhou um prêmio
function checkIfRouletteAlreadyPlayed() {
  const alreadyWon = localStorage.getItem('rouletteWon') === 'true';
  
  // Também verificar o cookie como backup
  const cookieWon = getCookie('rouletteWon') === 'true';
  
  return alreadyWon || cookieWon;
}

// Define um cookie
function setCookie(name, value, days) {
  let expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

// Obtém o valor de um cookie
function getCookie(name) {
  return document.cookie.split('; ').reduce((acc, cookie) => {
    let [key, val] = cookie.split('=');
    return key === name ? val : acc;
  }, "");
}

// Verifica se um cookie existe
function checkCookie(nome) {
  return getCookie(nome) !== "";
}

// Busca a localização do usuário
async function fetchLocation() {
  try {
    let response = await fetch('https://get.geojs.io/v1/ip/geo.json');
    let { city = "Local Desconhecido", region = "Local Desconhecido" } = await response.json();
    return { city, region };
  } catch (error) {
    console.error('Erro ao obter a localização:', error);
    return { city: "Local Desconhecido", region: "Local Desconhecido" };
  }
}

// Atualiza informações de localização na interface
async function atualizarLocalizacao() {
  let cidade = getCookie("localCidade");
  let estado = getCookie("localEstado");

  if (!cidade || !estado) {
    ({ city: cidade, region: estado } = await fetchLocation());
  }

  document.querySelectorAll("#localCidade").forEach(el => el.textContent = cidade);
  document.querySelectorAll("#localEstado").forEach(el => el.textContent = estado);
  
  return { cidade, estado };
}

// Escolhe frases aleatórias para notificações
function escolherFraseAleatoria() {
  const frases = [
    "🎉 <b>Lucas</b> acabou de comprar o Combo BrutusBurguers's + batata frita!",
    "🚀 <b>Ana</b> garantiu o BrutusBurguers Duplo Onion + batata frita há 2 minutos!",
    "🎉 <b>Rafaela</b> finalizou a compra do Combo Alice a grande agora!",
    "🔥 <b>Fernando</b> comprou o Combo Dudu + Batata Frita há poucos instantes!",
    "😋 <b>Isabela</b> adicionou um Combo BrutusBurguers ao carrinho!",
    "⏳ <b>Bruno</b> comprou o Combo 3! Restam poucas unidades!",
    "📦 <b>João</b> pediu 2 Combos de Hamburguer agora mesmo!",
    "🏆 <b>Mirella</b> garantiu o Combo Mais Vendido – Combo BrutusBurguers!",
    "🚨 <b>Atenção</b>! Mais de <b>15 pedidos</b> nos últimos 10 minutos!",
    "🔥 Nas últimas 2 horas, 37 pessoas compraram nossos combos!",
    "⚡ Acabamos de bater 100 pedidos de Hamburguer só hoje!",
    "⏳ Apenas 4 unidades do Combo 3 restantes! Corra antes que acabe!",
    "🚀 +20 pedidos feitos nos últimos 30 minutos! BrutusBurguers bombando!",
    "⏳ Os combos estão esgotando rápido! Aproveite agora!",
    "🎯 Mais de 250 clientes satisfeitos nos últimos 7 dias!",
    "🔥 Obrigado! Mais de 500 pedidos já saíram esse mês!",
    "🚀 Só hoje, 73 clientes garantiram seu combo de Hamburguer!",
    "⏳ O estoque do Combo 3 está quase esgotando! Últimas unidades!",
    "🎉 Promoção fazendo sucesso! +40 pedidos só hoje!"
  ];

  const indiceAleatorio = Math.floor(Math.random() * frases.length);
  return frases[indiceAleatorio];
}

// Mostra notificações aleatórias
function mostrarNotificacao(frase) {
  if (!Swal.isVisible()) {
    const Toast = Swal.mixin({
      toast: true,
      position: "bottom-end",
      showConfirmButton: false,
      timer: 6500,
      timerProgressBar: true,
    });
    Toast.fire({
      icon: "success",
      title: frase
    });
  }
}

// Diminui o estoque periodicamente
function diminuirEstoque() {
  document.querySelectorAll("#estoqueCombo").forEach(elemento => {
    let estoqueAtual = parseInt(elemento.textContent, 10);
    if (estoqueAtual > 1) {
      elemento.textContent = estoqueAtual - 1;
    }
  });
}

// Escolhe a localização do usuário
async function escolherLocalizacao() {
  await atualizarLocalizacao();

  if (checkCookie("localCidade") && checkCookie("localEstado")) {
    return;
  }

  let buscarLocalizacao = (await fetchLocation());
  let estado = buscarLocalizacao.region;
  let cidadeTemp = buscarLocalizacao.city;
  let uf = estados[estado] || "";

  let { value: estadoEscolhido } = await Swal.fire({
    title: "Procure a loja mais próxima de você!",
    text: "Escolha seu estado:",
    input: "select",
    inputOptions: estados_input,
    inputPlaceholder: "Escolha seu estado",
    inputValue: uf,
    confirmButtonText: "Próximo",
    confirmButtonColor: "green",
    allowOutsideClick: false,
    allowEscapeKey: false,
    inputValidator: value => value ? undefined : "Por favor, escolha seu estado."
  });

  setCookie("localEstado", estadoEscolhido, 365);

  var quais_opt_de_cidade = []

  cidades_por_estados.forEach((item, index) => {
    if (item[0] == estadoEscolhido) {
      quais_opt_de_cidade.push(item[1])
    }
  });

  let { value: cidadeEscolhida } = await Swal.fire({
    title: "Estamos quase lá...",
    text: "Agora, selecione sua cidade:",
    input: "select",
    inputOptions: quais_opt_de_cidade,
    inputValue: quais_opt_de_cidade.indexOf(cidadeTemp),
    confirmButtonText: "Procurar loja mais próxima!",
    confirmButtonColor: "green",
    allowOutsideClick: false,
    allowEscapeKey: false,
    inputValidator: value => value ? undefined : "Por favor, escolha sua cidade."
  });

  cidadeEscolhida = quais_opt_de_cidade[cidadeEscolhida];

  setCookie("localCidade", cidadeEscolhida, 365);

  Swal.fire({
    title: "Procurando a loja mais próxima...",
    html: `Procurando a loja mais próxima de você em <b>${cidadeEscolhida}</b>...`,
    timer: 5000,
    timerProgressBar: true,
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  }).then(() => {
    // Verificar se o usuário já jogou a roleta para mudar o texto do botão
    const hasPlayed = checkIfRouletteAlreadyPlayed();
    const buttonText = "Olhar cardápio de ofertas!";
    
    Swal.fire({
      html: `A loja mais próxima fica a <b>4,5km</b> de você! Seu pedido chegará entre 30 a 50 minutos.`,
      icon: "success",
      confirmButtonText: buttonText,
      confirmButtonColor: "green",
      allowOutsideClick: false,
    }).then(() => {
      atualizarLocalizacao();
      
      // Se não jogou, mostrar a roleta
      // if (!hasPlayed) {
      //   document.getElementById("roulette-modal-container").style.display = "flex";
      //   setTimeout(() => {
      //     if (typeof createWheel === "function") createWheel();
      //   }, 50);
      // }
    });
  });
}

// Inicialização do documento
document.addEventListener('DOMContentLoaded', function() {
  // Configuração dos Prêmios
  const prizes = [
    { name: '50% de CASH BACK', icon: '', color: '#d10000' },
    { name: '30% de desconto', icon: '', color: '#222222' },
    { name: '1 Combo grátis no próximo pedido', icon: '', color: '#d10000' },
    { name: '5% de desconto', icon: '', color: '#222222' },
    { name: '20% de desconto', icon: '', color: '#d10000' },
    { name: 'Combo Casal gratuito', icon: '', color: '#222222' }
  ];

  // Inicia o gerenciador da roleta
  const rouletteManager = new RouletteManager({ prizes });
  
  // Configura os timers para as notificações e atualização de estoque
  setInterval(() => {
    const fraseAleatoria = escolherFraseAleatoria();
    mostrarNotificacao(fraseAleatoria);
  }, 25000);
  
  setInterval(diminuirEstoque, 15000);
  
  // Inicia o processo de localização
  escolherLocalizacao();
});