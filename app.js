// Esperar que o DOM esteja completamente carregado antes de executar o código
document.addEventListener("DOMContentLoaded", function () {
  // Obter referências aos elementos do DOM
  const canvas = document.getElementById("signature-pad");
  const ctx = canvas.getContext("2d");
  const limparBtn = document.getElementById("limpar");
  const previewBtn = document.getElementById("preview-btn");
  const downloadBtn = document.getElementById("download");
  const nomeInput = document.getElementById("nome");
  const nomeAssinatura = document.getElementById("nome-assinatura");
  const preview = document.getElementById("preview");
  const previewContainer = document.querySelector(".preview-container");

  // Inicialmente esconder o botão de download
  downloadBtn.style.display = "none";

  // Variáveis para controlar o desenho da assinatura
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;
  let dataUrl = null;

  // Configurar o contexto do canvas para a assinatura
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#000";

  // Função para iniciar o desenho
  function startDrawing(e) {
    isDrawing = true;

    // Obter as coordenadas corretas, tanto para mouse quanto para touch
    const { offsetX, offsetY } = getCoordinates(e);

    // Definir o ponto inicial
    lastX = offsetX;
    lastY = offsetY;
  }

  // Função para desenhar no canvas
  function draw(e) {
    // Se não estiver desenhando, sair da função
    if (!isDrawing) return;

    // Evitar que a página role em dispositivos touch
    e.preventDefault();

    // Obter as coordenadas atuais
    const { offsetX, offsetY } = getCoordinates(e);

    // Desenhar a linha
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();

    // Atualizar as últimas coordenadas
    lastX = offsetX;
    lastY = offsetY;
  }

  // Função para parar de desenhar
  function stopDrawing() {
    isDrawing = false;
  }

  // Função auxiliar para obter coordenadas corretamente em diferentes dispositivos
  function getCoordinates(e) {
    let offsetX, offsetY;

    // Verificar se é um evento de toque ou de mouse
    if (e.type.includes("touch")) {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0] || e.changedTouches[0];

      offsetX = touch.clientX - rect.left;
      offsetY = touch.clientY - rect.top;
    } else {
      offsetX = e.offsetX;
      offsetY = e.offsetY;
    }

    return { offsetX, offsetY };
  }

  // Função para limpar o canvas de assinatura
  function limparAssinatura() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    preview.style.display = "none";
    downloadBtn.style.display = "none";
    previewBtn.style.display = "inline-flex";

    // Rolar para a área de assinatura
    canvas.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // Função para gerar e mostrar a imagem no preview
  function gerarPreview() {
    // Verificar se há um nome inserido
    if (!nomeInput.value.trim()) {
      alert("Por favor, digite seu nome completo antes de gerar a imagem.");
      return;
    }

    // Obter os dados da assinatura
    const signatureData = getSignatureData();

    // Se não houver dados de assinatura, mostrar alerta
    if (!signatureData) {
      alert("Por favor, faça sua assinatura antes de continuar.");
      return;
    }

    // Criar um canvas temporário para adicionar o nome
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    // Configurar o tamanho do canvas temporário (canvas original + espaço para o nome)
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height + 40; // Espaço adicional para o nome

    // Fundo branco
    tempCtx.fillStyle = "#fff";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Encontrar a área útil da assinatura (para centralizar)
    const bounds = findSignatureBounds(
      signatureData,
      canvas.width,
      canvas.height
    );
    if (bounds) {
      // Calcular a posição centralizada (horizontalmente) para a assinatura
      const signatureWidth = bounds.maxX - bounds.minX;
      const centerX = (tempCanvas.width - signatureWidth) / 2;
      const offsetX = centerX - bounds.minX;

      // Calcular posição vertical para deixar espaço entre a assinatura e a linha
      const signatureHeight = bounds.maxY - bounds.minY;
      const targetY = canvas.height - signatureHeight - 15; // 15px acima da linha
      const offsetY = targetY - bounds.minY;

      // Desenhar a assinatura centralizada
      tempCtx.drawImage(
        canvas,
        0,
        0,
        canvas.width,
        canvas.height,
        offsetX,
        offsetY,
        canvas.width,
        canvas.height
      );
    } else {
      // Se não conseguir determinar os limites, apenas copiar a assinatura
      tempCtx.drawImage(canvas, 0, 0);
    }

    // Desenhar a linha de assinatura
    tempCtx.beginPath();
    tempCtx.moveTo(50, canvas.height + 5);
    tempCtx.lineTo(tempCanvas.width - 50, canvas.height + 5);
    tempCtx.stroke();

    // Adicionar o nome abaixo da linha
    tempCtx.font = "16px Arial";
    tempCtx.fillStyle = "#000";
    tempCtx.textAlign = "center";
    tempCtx.fillText(nomeInput.value, tempCanvas.width / 2, canvas.height + 30);

    // Mostrar a imagem na pré-visualização
    dataUrl = tempCanvas.toDataURL("image/png");
    preview.src = dataUrl;
    preview.style.display = "block";

    // Mostrar o botão de download e esconder o botão de preview
    downloadBtn.style.display = "inline-flex";
    previewBtn.style.display = "none";

    // Rolar para o preview
    previewContainer.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // Função para baixar a imagem
  function downloadImagem() {
    if (!dataUrl) return;

    // Criar um link para download e simular o clique
    const downloadLink = document.createElement("a");
    downloadLink.href = dataUrl;
    downloadLink.download =
      "assinatura_" + nomeInput.value.replace(/\s+/g, "_") + ".png";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }

  // Função para verificar se há dados de assinatura
  function getSignatureData() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Verificar se há pixels não transparentes
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) {
        return imageData;
      }
    }

    return null;
  }

  // Função para encontrar os limites da assinatura
  function findSignatureBounds(imageData, width, height) {
    if (!imageData) return null;

    const data = imageData.data;
    let minX = width,
      minY = height,
      maxX = 0,
      maxY = 0;
    let found = false;

    // Percorrer todos os pixels para encontrar os limites
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        // Verificar se o pixel é visível (não transparente)
        if (data[idx + 3] > 0) {
          minX = Math.min(x, minX);
          maxX = Math.max(x, maxX);
          minY = Math.min(y, minY);
          maxY = Math.max(y, maxY);
          found = true;
        }
      }
    }

    return found ? { minX, minY, maxX, maxY } : null;
  }

  // Atualizar o nome exibido abaixo da linha de assinatura quando digitado
  nomeInput.addEventListener("input", function () {
    nomeAssinatura.textContent = this.value || "Nome do Assinante";
  });

  // Event listeners para desenho com mouse
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mouseout", stopDrawing);

  // Event listeners para desenho com touch (dispositivos móveis)
  canvas.addEventListener("touchstart", startDrawing);
  canvas.addEventListener("touchmove", draw);
  canvas.addEventListener("touchend", stopDrawing);

  // Event listeners para os botões
  limparBtn.addEventListener("click", limparAssinatura);
  previewBtn.addEventListener("click", gerarPreview);
  downloadBtn.addEventListener("click", downloadImagem);

  // Ajustar o tamanho do canvas para corresponder ao tamanho de exibição
  function resizeCanvas() {
    const oldData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    // Verifica se o tamanho real é diferente do tamanho de exibição
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#000";
      ctx.putImageData(oldData, 0, 0);
    }
  }

  // Redimensionar o canvas quando a janela for redimensionada
  window.addEventListener("resize", resizeCanvas);

  // Inicializar o tamanho do canvas
  resizeCanvas();
});
