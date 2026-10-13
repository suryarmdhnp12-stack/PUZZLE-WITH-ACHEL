// Controller Utama Aplikasi Puzzle Kita

document.addEventListener('DOMContentLoaded', () => {
  // Elemen DOM utama
  const canvas = document.getElementById('puzzleCanvas');
  const lobbyModal = document.getElementById('lobbyModal');
  const setupModal = document.getElementById('setupModal');
  const victoryModal = document.getElementById('victoryModal');

  const playerNameInput = document.getElementById('playerNameInput');
  const customRoomInput = document.getElementById('customRoomInput');
  const joinRoomInput = document.getElementById('joinRoomInput');
  const createRoomBtn = document.getElementById('createRoomBtn');
  const joinRoomBtn = document.getElementById('joinRoomBtn');
  const playSoloBtn = document.getElementById('playSoloBtn');

  const roomCodeDisplay = document.getElementById('roomCodeDisplay');
  const connectionDot = document.getElementById('connectionDot');
  const copyInviteBtn = document.getElementById('copyInviteBtn');
  const player1Tag = document.getElementById('player1Tag');
  const player2Tag = document.getElementById('player2Tag');

  const progressText = document.getElementById('progressText');
  const progressFill = document.getElementById('progressFill');
  const timerDisplay = document.getElementById('timerDisplay');

  const toggleEdgeFilterBtn = document.getElementById('toggleEdgeFilterBtn');
  const organizePiecesBtn = document.getElementById('organizePiecesBtn');
  const toggleGhostBtn = document.getElementById('toggleGhostBtn');
  const ghostBtnLabel = document.getElementById('ghostBtnLabel');
  const openSetupBtn = document.getElementById('openSetupBtn');
  const openLobbyBtn = document.getElementById('openLobbyBtn');
  const closeSetupModalBtn = document.getElementById('closeSetupModalBtn');

  // Theme elements
  const themeSelectorBtn = document.getElementById('themeSelectorBtn');
  const themeBtnLabel = document.getElementById('themeBtnLabel');
  const themeMenu = document.getElementById('themeMenu');
  const tableViewport = document.getElementById('tableViewport');

  // Setup Modal elements
  const uploadDropzone = document.getElementById('uploadDropzone');
  const photoFileInput = document.getElementById('photoFileInput');
  const setupPreviewImg = document.getElementById('setupPreviewImg');
  const mysteryModeCheckbox = document.getElementById('mysteryModeCheckbox');
  const pieceCountSlider = document.getElementById('pieceCountSlider');
  const sliderPieceReadout = document.getElementById('sliderPieceReadout');
  const surpriseTitleInput = document.getElementById('surpriseTitleInput');
  const surpriseMessageInput = document.getElementById('surpriseMessageInput');
  const surpriseVoucherInput = document.getElementById('surpriseVoucherInput');
  const applyPuzzleSetupBtn = document.getElementById('applyPuzzleSetupBtn');

  // Box Widget elements
  const puzzleBoxWidget = document.getElementById('puzzleBoxWidget');
  const minimizeBoxBtn = document.getElementById('minimizeBoxBtn');
  const boxPreviewImg = document.getElementById('boxPreviewImg');
  const mysteryCover = document.getElementById('mysteryCover');
  const boxPieceCountBadge = document.getElementById('boxPieceCountBadge');

  // Camera & Cursor elements
  const panModeToggleBtn = document.getElementById('panModeToggleBtn');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const resetViewBtn = document.getElementById('resetViewBtn');
  const zoomLevelText = document.getElementById('zoomLevelText');
  const partnerCursor = document.getElementById('partnerCursor');
  const partnerCursorName = document.getElementById('partnerCursorName');

  // Victory Modal elements
  const victoryStatsText = document.getElementById('victoryStatsText');
  const victoryFinalImg = document.getElementById('victoryFinalImg');
  const envelopePrompt = document.getElementById('envelopePrompt');
  const openEnvelopeBtn = document.getElementById('openEnvelopeBtn');
  const loveLetterBox = document.getElementById('loveLetterBox');
  const letterTitleDisplay = document.getElementById('letterTitleDisplay');
  const letterBodyDisplay = document.getElementById('letterBodyDisplay');
  const voucherTicketDisplay = document.getElementById('voucherTicketDisplay');
  const voucherTextDisplay = document.getElementById('voucherTextDisplay');
  const closeVictoryBtn = document.getElementById('closeVictoryBtn');
  const playAgainBtn = document.getElementById('playAgainBtn');

  // State aplikasi saat ini
  let currentConfig = {
    imageDataUrl: '',
    targetPieces: 100,
    seed: Math.floor(Math.random() * 999999) + 1,
    mysteryMode: false,
    theme: 'cabin',
    surprise: {
      title: surpriseTitleInput.value,
      message: surpriseMessageInput.value,
      voucher: surpriseVoucherInput.value,
    },
  };

  let currentImageObj = null;
  let startTime = Date.now();
  let elapsedSeconds = 0;
  let timerInterval = null;

  // 1. Inisialisasi Mesin Jigsaw
  const engine = new window.JigsawEngine(canvas, {
    onZoomChange: (z) => {
      zoomLevelText.textContent = `${Math.round(z * 100)}%`;
    },
    onProgress: ({ lockedCount, total, percent }) => {
      progressText.textContent = `${lockedCount} / ${total} keping (${percent}%)`;
      progressFill.style.width = `${percent}%`;
    },
    onCursorMove: (wx, wy) => {
      mp.sendCursor(wx, wy);
    },
    onPiecesDrag: (updates) => {
      mp.sendDrag(updates);
    },
    onPiecesDrop: (updates) => {
      mp.sendDrop(updates);
    },
    onComplete: () => {
      triggerVictoryModal();
      mp.send({
        type: 'VICTORY_REVEAL',
        elapsedSeconds,
      });
    },
  });

  // 2. Inisialisasi Multiplayer
  const mp = new window.PuzzleMultiplayer({
    onRoomReady: (code) => {
      roomCodeDisplay.textContent = code;
      connectionDot.className = 'status-dot waiting';
      showToast(`Room "${code}" siap! Bagikan link atau kodenya ke pacarmu ❤️`);
    },
    onPartnerJoined: (partnerName) => {
      player2Tag.textContent = `${partnerName} ❤️`;
      player2Tag.classList.remove('waiting');
      connectionDot.className = 'status-dot online';
      partnerCursorName.textContent = `${partnerName} ❤️`;
      showToast(`🎉 ${partnerName} bergabung ke meja puzzle!`);
      window.soundFX.playPop();
    },
    onHostNeedsToSendPuzzle: () => {
      sendFullPuzzleToPartner();
    },
    onReceivePuzzleInit: (data) => {
      showToast('📸 Menerima foto puzzle dari pasanganmu...');
      currentConfig = {
        imageDataUrl: data.imageDataUrl,
        targetPieces: data.targetPieces,
        seed: data.seed,
        mysteryMode: data.mysteryMode,
        theme: data.theme || currentConfig.theme,
        surprise: data.surprise || currentConfig.surprise,
      };
      if (data.theme) {
        applyTheme(data.theme, false);
      }
      if (data.hostName) {
        player2Tag.textContent = `${data.hostName} ❤️`;
        player2Tag.classList.remove('waiting');
        connectionDot.className = 'status-dot online';
        partnerCursorName.textContent = `${data.hostName} ❤️`;
      }
      loadPuzzleFromConfig(currentConfig, data.puzzleState);
    },
    onPartnerChangeTheme: (theme) => {
      applyTheme(theme, false);
      showToast('🎨 Pasanganmu mengubah suasana background meja!');
    },
    onPartnerCursor: (wx, wy, name) => {
      partnerCursor.classList.remove('hidden');
      partnerCursorName.textContent = name;
      const screenPos = engine.worldToScreen(wx, wy);
      partnerCursor.style.transform = `translate(${screenPos.x}px, ${screenPos.y + 62}px)`;
    },
    onPartnerDragPieces: (updates) => {
      engine.applyRemotePiecesUpdate(updates, 'partner');
    },
    onPartnerDropPieces: (updates) => {
      engine.applyRemotePiecesUpdate(updates, null);
    },
    onPartnerOrganizePieces: (updates) => {
      engine.applyRemotePiecesUpdate(updates, null);
      showToast('✨ Pasanganmu merapikan kepingan di meja!');
    },
    onReceiveEmoji: (emoji, sender) => {
      spawnFloatingEmoji(emoji, sender);
      window.soundFX.playPop();
    },
    onReceiveVictory: () => {
      if (!engine.isCompleted) {
        engine.isCompleted = true;
        window.soundFX.playVictory();
        triggerVictoryModal();
      }
    },
    onDisconnected: () => {
      connectionDot.className = 'status-dot waiting';
      player2Tag.textContent = 'Terputus (Menunggu...)';
      player2Tag.classList.add('waiting');
      partnerCursor.classList.add('hidden');
      showToast('⚠️ Koneksi pasangan terputus sementara.');
    },
    onError: (msg) => {
      showToast(`⚠️ ${msg}`);
    },
  });

  const themeLabels = {
    cabin: '🌲 Kabin Pinus',
    picnic: '🧺 Piknik Rumput',
    beach: '🏖️ Pantai Tropis',
    galaxy: '🌌 Malam Berbintang',
  };

  function applyTheme(themeName, broadcast = false) {
    const validTheme = themeLabels[themeName] ? themeName : 'cabin';
    currentConfig.theme = validTheme;

    if (tableViewport) {
      tableViewport.className = `table-viewport theme-${validTheme}`;
    }
    document.body.className = validTheme === 'galaxy' ? 'theme-galaxy' : '';

    if (themeBtnLabel) {
      themeBtnLabel.textContent = `Tema: ${themeLabels[validTheme].split(' ')[1]}`;
    }

    document.querySelectorAll('.theme-menu-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.theme === validTheme);
    });

    document.querySelectorAll('.theme-card').forEach((card) => {
      card.classList.toggle('active', card.dataset.theme === validTheme);
    });

    if (engine && engine.setTheme) {
      engine.setTheme(validTheme);
    }

    if (broadcast) {
      mp.sendTheme(validTheme);
    }
  }

  function sendFullPuzzleToPartner() {
    if (!currentConfig.imageDataUrl) return;
    mp.send({
      type: 'INIT_PUZZLE',
      imageDataUrl: currentConfig.imageDataUrl,
      targetPieces: currentConfig.targetPieces,
      seed: currentConfig.seed,
      mysteryMode: currentConfig.mysteryMode,
      theme: currentConfig.theme,
      surprise: currentConfig.surprise,
      puzzleState: engine.getSerializedState(),
      hostName: mp.myName,
    });
  }

  // 3. Generator Ilustrasi Romantis Bawaan (Agar bisa langsung dicoba tanpa upload)
  function generateSampleArtwork(type = 'sunset') {
    const c = document.createElement('canvas');
    c.width = 1200;
    c.height = 840;
    const ctx = c.getContext('2d');

    if (type === 'sunset') {
      const grad = ctx.createLinearGradient(0, 0, 0, c.height);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.35, '#9d174d');
      grad.addColorStop(0.68, '#f97316');
      grad.addColorStop(1, '#fde047');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, c.width, c.height);

      // Matahari terbenam besar
      ctx.fillStyle = 'rgba(255, 247, 200, 0.92)';
      ctx.beginPath();
      ctx.arc(600, 490, 145, 0, Math.PI * 2);
      ctx.fill();

      // Laut & pantulan cahaya
      const seaGrad = ctx.createLinearGradient(0, 540, 0, c.height);
      seaGrad.addColorStop(0, '#7c2d12');
      seaGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = seaGrad;
      ctx.fillRect(0, 540, c.width, c.height - 540);

      ctx.fillStyle = 'rgba(253, 224, 71, 0.45)';
      for (let i = 0; i < 18; i++) {
        const y = 555 + i * 15;
        const w = 220 - i * 8 + Math.sin(i) * 25;
        ctx.fillRect(600 - w / 2, y, w, 6);
      }

      // Bukit siluet & pasangan duduk bersama
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.moveTo(0, 680);
      ctx.quadraticCurveTo(350, 590, 760, 690);
      ctx.lineTo(1200, 670);
      ctx.lineTo(1200, 840);
      ctx.lineTo(0, 840);
      ctx.fill();

      // Siluet 2 orang & hati di atasnya
      ctx.fillStyle = '#ff4d79';
      drawHeart(ctx, 380, 460, 44);
    } else if (type === 'picnic') {
      const sky = ctx.createLinearGradient(0, 0, 0, 420);
      sky.addColorStop(0, '#38bdf8');
      sky.addColorStop(1, '#bae6fd');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, c.width, 420);

      // Padang rumput hijau penuh bunga kuning (mirip suasana foto user!)
      const grass = ctx.createLinearGradient(0, 380, 0, c.height);
      grass.addColorStop(0, '#65a30d');
      grass.addColorStop(1, '#15803d');
      ctx.fillStyle = grass;
      ctx.fillRect(0, 380, c.width, c.height - 380);

      // Pepohonan di kejauhan
      for (let i = 0; i < 14; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#166534' : '#14532d';
        ctx.beginPath();
        ctx.arc(80 + i * 90, 360 + (i % 3) * 15, 75, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bunga-bunga dandelion kuning & putih di rumput
      for (let i = 0; i < 180; i++) {
        const fx = (i * 73) % c.width;
        const fy = 430 + ((i * 47) % 390);
        ctx.fillStyle = i % 3 === 0 ? '#ffffff' : '#facc15';
        ctx.beginPath();
        ctx.arc(fx, fy, 6 + (i % 5), 0, Math.PI * 2);
        ctx.fill();
      }

      // Tikar piknik kotak-kotak merah putih
      ctx.save();
      ctx.translate(600, 630);
      ctx.fillStyle = '#fff1f2';
      ctx.fillRect(-220, -90, 440, 180);
      ctx.fillStyle = '#f43f5e';
      for (let r = 0; r < 4; r++) {
        for (let col = 0; col < 8; col++) {
          if ((r + col) % 2 === 0) {
            ctx.fillRect(-220 + col * 55, -90 + r * 45, 55, 45);
          }
        }
      }
      ctx.restore();
      drawHeart(ctx, 600, 220, 60);
    } else {
      // Malam berbintang (Starry Night)
      const night = ctx.createLinearGradient(0, 0, 0, c.height);
      night.addColorStop(0, '#090a10');
      night.addColorStop(0.6, '#1e1b4b');
      night.addColorStop(1, '#311042');
      ctx.fillStyle = night;
      ctx.fillRect(0, 0, c.width, c.height);

      for (let i = 0; i < 220; i++) {
        const sx = (i * 97) % c.width;
        const sy = (i * 53) % 620;
        ctx.fillStyle = i % 5 === 0 ? '#fde047' : '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, sy, (i % 3) + 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bulan sabit
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(880, 190, 68, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#131331';
      ctx.beginPath();
      ctx.arc(855, 175, 62, 0, Math.PI * 2);
      ctx.fill();

      drawHeart(ctx, 560, 360, 55);
    }

    // Tulisan manis di pojok foto contoh
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.font = 'bold 34px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Puzzle Kenangan Kita ❤️', c.width / 2, 78);

    return c.toDataURL('image/jpeg', 0.88);
  }

  function drawHeart(ctx, x, y, size) {
    ctx.save();
    ctx.fillStyle = '#ff4d79';
    ctx.shadowColor = 'rgba(255, 77, 121, 0.6)';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.moveTo(x, y + size / 4);
    ctx.quadraticCurveTo(x, y, x + size / 4, y);
    ctx.quadraticCurveTo(x + size / 2, y, x + size / 2, y + size / 4);
    ctx.quadraticCurveTo(x + size / 2, y, x + (size * 3) / 4, y);
    ctx.quadraticCurveTo(x + size, y, x + size, y + size / 4);
    ctx.quadraticCurveTo(x + size, y + size / 2, x + (size * 3) / 4, y + (size * 3) / 4);
    ctx.lineTo(x + size / 2, y + size);
    ctx.lineTo(x + size / 4, y + (size * 3) / 4);
    ctx.quadraticCurveTo(x, y + size / 2, x, y + size / 4);
    ctx.fill();
    ctx.restore();
  }

  // 4. Fungsi Memuat & Memotong Foto Menjadi Kepingan Jigsaw
  function loadPuzzleFromConfig(config, remoteState = null) {
    const img = new Image();
    img.onload = () => {
      currentImageObj = img;
      setupPreviewImg.src = config.imageDataUrl;
      boxPreviewImg.src = config.imageDataUrl;
      victoryFinalImg.src = config.imageDataUrl;

      updateSliderReadout(img.width, img.height, config.targetPieces);

      engine.buildPuzzle(img, config.targetPieces, config.seed);

      const actualTotal = engine.pieces.length;
      boxPieceCountBadge.textContent = `${actualTotal} PCS`;

      if (config.mysteryMode) {
        mysteryCover.classList.remove('hidden');
        engine.ghostOpacity = 0;
        ghostBtnLabel.textContent = 'Bayangan: OFF';
      } else {
        mysteryCover.classList.add('hidden');
      }

      if (config.theme) {
        applyTheme(config.theme, false);
      }

      if (remoteState && Array.isArray(remoteState)) {
        engine.applyRemotePiecesUpdate(remoteState, null);
        engine.notifyProgress();
      }

      resetTimer();
    };
    img.src = config.imageDataUrl;
  }

  function updateSliderReadout(imgW, imgH, targetVal) {
    const w = imgW || (currentImageObj ? currentImageObj.width : 1200);
    const h = imgH || (currentImageObj ? currentImageObj.height : 840);
    const grid = window.JigsawEngine.computeGridDimensions(w, h, targetVal);
    sliderPieceReadout.textContent = `${grid.total} Keping (${grid.cols} × ${grid.rows})`;
  }

  // 5. Upload Foto Custom & Kompresi Cerdas (Agar tajam tapi cepat dikirim ke HP pacar)
  function handleCustomImageFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('⚠️ Mohon pilih file gambar/foto (JPG/PNG/WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const tempImg = new Image();
      tempImg.onload = () => {
        const maxDim = 1350;
        let w = tempImg.width;
        let h = tempImg.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const off = document.createElement('canvas');
        off.width = w;
        off.height = h;
        off.getContext('2d').drawImage(tempImg, 0, 0, w, h);
        const compressedDataUrl = off.toDataURL('image/jpeg', 0.86);

        currentConfig.imageDataUrl = compressedDataUrl;
        setupPreviewImg.src = compressedDataUrl;
        document.querySelectorAll('.sample-btn').forEach((b) => b.classList.remove('active'));
        updateSliderReadout(w, h, parseInt(pieceCountSlider.value, 10));
        showToast('📸 Foto berhasil dimuat! Klik "Buat & Acak Kepingan Puzzle" untuk memulai.');
      };
      tempImg.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  uploadDropzone.addEventListener('click', () => photoFileInput.click());
  photoFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleCustomImageFile(e.target.files[0]);
    }
  });

  uploadDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadDropzone.style.borderColor = '#e84a7f';
  });
  uploadDropzone.addEventListener('dragleave', () => {
    uploadDropzone.style.borderColor = '#d8c7b8';
  });
  uploadDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadDropzone.style.borderColor = '#d8c7b8';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleCustomImageFile(e.dataTransfer.files[0]);
    }
  });

  // Tombol gambar contoh
  document.querySelectorAll('.sample-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sample-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const sampleType = btn.dataset.sample;
      currentConfig.imageDataUrl = generateSampleArtwork(sampleType);
      setupPreviewImg.src = currentConfig.imageDataUrl;
      updateSliderReadout(1200, 840, parseInt(pieceCountSlider.value, 10));
    });
  });

  // Tombol preset tingkat kesulitan
  document.querySelectorAll('.diff-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.diff-card').forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      const count = parseInt(card.dataset.pieces, 10);
      pieceCountSlider.value = count;
      updateSliderReadout(null, null, count);
    });
  });

  pieceCountSlider.addEventListener('input', () => {
    const val = parseInt(pieceCountSlider.value, 10);
    document.querySelectorAll('.diff-card').forEach((c) => {
      c.classList.toggle('active', parseInt(c.dataset.pieces, 10) === val);
    });
    updateSliderReadout(null, null, val);
  });

  // Terapkan Pengaturan Puzzle & Kirim ke Pasangan
  applyPuzzleSetupBtn.addEventListener('click', () => {
    currentConfig.targetPieces = parseInt(pieceCountSlider.value, 10);
    currentConfig.seed = Math.floor(Math.random() * 999999) + 1;
    currentConfig.mysteryMode = mysteryModeCheckbox.checked;
    currentConfig.surprise = {
      title: surpriseTitleInput.value.trim() || 'Yeay! Kita Berhasil Menyusunnya Bersama ❤️',
      message: surpriseMessageInput.value.trim(),
      voucher: surpriseVoucherInput.value.trim(),
    };

    loadPuzzleFromConfig(currentConfig);
    setupModal.classList.add('hidden');
    showToast(`🧩 Puzzle ${engine.pieces.length} keping siap dirangkai!`);

    // Kirim ke pasangan jika sedang di dalam room
    setTimeout(() => {
      sendFullPuzzleToPartner();
    }, 150);
  });

  // 6. Lobby & Room Events
  createRoomBtn.addEventListener('click', () => {
    const myName = playerNameInput.value.trim() || 'Sayang';
    const customCode = customRoomInput.value.trim();
    player1Tag.textContent = myName;
    mp.createRoom(customCode, myName);
    lobbyModal.classList.add('hidden');
    setupModal.classList.remove('hidden');
  });

  joinRoomBtn.addEventListener('click', () => {
    const code = joinRoomInput.value.trim();
    if (!code) {
      showToast('⚠️ Masukkan Kode Room dari pasanganmu dulu ya!');
      joinRoomInput.focus();
      return;
    }
    const myName = playerNameInput.value.trim() || 'Ayang';
    player1Tag.textContent = myName;
    roomCodeDisplay.textContent = code.toUpperCase();
    connectionDot.className = 'status-dot waiting';
    mp.joinRoom(code, myName);
    lobbyModal.classList.add('hidden');
    showToast(`🔍 Menghubungkan ke Room "${code.toUpperCase()}"...`);
  });

  playSoloBtn.addEventListener('click', () => {
    const myName = playerNameInput.value.trim() || 'Kamu';
    player1Tag.textContent = myName;
    lobbyModal.classList.add('hidden');
    setupModal.classList.remove('hidden');
  });

  // Salin Link Undangan Otomatis (?room=KODE)
  copyInviteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!mp.roomCode) {
      lobbyModal.classList.remove('hidden');
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set('room', mp.roomCode);
    navigator.clipboard.writeText(url.toString()).then(() => {
      showToast(`📋 Link Room "${mp.roomCode}" disalin! Kirimkan ke WhatsApp pacarmu.`);
    });
  });

  // 7. Tombol Bantuan di HUD Atas
  toggleEdgeFilterBtn.addEventListener('click', () => {
    engine.edgeOnlyFilter = !engine.edgeOnlyFilter;
    toggleEdgeFilterBtn.classList.toggle('active', engine.edgeOnlyFilter);
    showToast(
      engine.edgeOnlyFilter
        ? '🖼️ Menampilkan kepingan bagian pinggir/bingkai saja.'
        : '🧩 Menampilkan seluruh kepingan puzzle.'
    );
  });

  organizePiecesBtn.addEventListener('click', () => {
    const updates = engine.organizeLoosePieces(engine.edgeOnlyFilter);
    if (updates.length > 0) {
      mp.sendOrganize(updates);
      window.soundFX.playPickup();
      showToast('✨ Kepingan yang berserakan sudah dirapikan di sisi papan!');
    }
  });

  const ghostLevels = [0, 0.2, 0.45];
  let ghostIdx = 1;
  toggleGhostBtn.addEventListener('click', () => {
    ghostIdx = (ghostIdx + 1) % ghostLevels.length;
    engine.ghostOpacity = ghostLevels[ghostIdx];
    const pct = Math.round(engine.ghostOpacity * 100);
    ghostBtnLabel.textContent = pct === 0 ? 'Bayangan: OFF' : `Bayangan: ${pct}%`;
  });

  openSetupBtn.addEventListener('click', () => setupModal.classList.remove('hidden'));
  closeSetupModalBtn.addEventListener('click', () => setupModal.classList.add('hidden'));
  openLobbyBtn.addEventListener('click', () => lobbyModal.classList.remove('hidden'));

  // 8. Kamera & Zoom Controls
  panModeToggleBtn.addEventListener('click', () => {
    engine.panMode = !engine.panMode;
    panModeToggleBtn.classList.toggle('active', engine.panMode);
    panModeToggleBtn.textContent = engine.panMode ? '✋ Geser Meja: ON' : '✋ Geser Meja: OFF';
  });

  zoomInBtn.addEventListener('click', () => engine.setZoom(engine.zoom * 1.2));
  zoomOutBtn.addEventListener('click', () => engine.setZoom(engine.zoom * 0.82));
  resetViewBtn.addEventListener('click', () => engine.fitTableToScreen());

  // 9. Kotak Referensi 3D (Bisa dikecilkan & digeser)
  minimizeBoxBtn.addEventListener('click', () => {
    puzzleBoxWidget.classList.toggle('minimized');
    minimizeBoxBtn.textContent = puzzleBoxWidget.classList.contains('minimized') ? '▢' : '_';
  });

  // 10. Reaksi Emoji Melayang
  document.querySelectorAll('.react-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const emoji = btn.dataset.emoji;
      const myName = player1Tag.textContent;
      spawnFloatingEmoji(emoji, myName);
      window.soundFX.playPop();
      mp.sendEmoji(emoji);
    });
  });

  function spawnFloatingEmoji(emoji, senderName) {
    const container = document.getElementById('floatingReactionsContainer');
    const el = document.createElement('div');
    el.className = 'floating-emoji';
    el.style.left = `${20 + Math.random() * 60}%`;
    el.innerHTML = `${emoji}<span>${senderName}</span>`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 2700);
  }

  // 11. Timer Permainan
  function resetTimer() {
    startTime = Date.now();
    elapsedSeconds = 0;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (!engine.isCompleted) {
        elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        timerDisplay.textContent = `⏱️ ${formatTime(elapsedSeconds)}`;
      }
    }, 1000);
  }

  function formatTime(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  // 12. Victory & Surprise Envelope Reveal
  function triggerVictoryModal() {
    mysteryCover.classList.add('hidden');
    victoryStatsText.textContent = `Diselesaikan bersama dalam waktu ${formatTime(elapsedSeconds)} • ${engine.pieces.length} Keping Jigsaw`;
    letterTitleDisplay.textContent = currentConfig.surprise.title;
    letterBodyDisplay.textContent = currentConfig.surprise.message;

    if (currentConfig.surprise.voucher) {
      voucherTicketDisplay.classList.remove('hidden');
      voucherTextDisplay.textContent = currentConfig.surprise.voucher;
    } else {
      voucherTicketDisplay.classList.add('hidden');
    }

    envelopePrompt.classList.remove('hidden');
    loveLetterBox.classList.add('hidden');
    victoryModal.classList.remove('hidden');
    startConfetti();
  }

  openEnvelopeBtn.addEventListener('click', () => {
    window.soundFX.playVictory();
    envelopePrompt.classList.add('hidden');
    loveLetterBox.classList.remove('hidden');
  });

  closeVictoryBtn.addEventListener('click', () => {
    victoryModal.classList.add('hidden');
  });

  playAgainBtn.addEventListener('click', () => {
    victoryModal.classList.add('hidden');
    setupModal.classList.remove('hidden');
  });

  function startConfetti() {
    const cCanvas = document.getElementById('confettiCanvas');
    cCanvas.width = window.innerWidth;
    cCanvas.height = window.innerHeight;
    const cCtx = cCanvas.getContext('2d');
    const pieces = Array.from({ length: 110 }, () => ({
      x: Math.random() * cCanvas.width,
      y: -20 - Math.random() * cCanvas.height * 0.5,
      w: 7 + Math.random() * 6,
      h: 10 + Math.random() * 8,
      vy: 2.2 + Math.random() * 3.5,
      vx: -1.5 + Math.random() * 3,
      rot: Math.random() * Math.PI * 2,
      color: ['#ff4d79', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa'][Math.floor(Math.random() * 5)],
    }));

    let frames = 0;
    function loop() {
      if (victoryModal.classList.contains('hidden') || frames > 360) {
        cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);
        return;
      }
      frames++;
      cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);
      pieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += 0.06;
        cCtx.save();
        cCtx.translate(p.x, p.y);
        cCtx.rotate(p.rot);
        cCtx.fillStyle = p.color;
        cCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        cCtx.restore();
      });
      requestAnimationFrame(loop);
    }
    loop();
  }

  function showToast(message) {
    const container = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = message;
    container.appendChild(t);
    setTimeout(() => t.remove(), 4200);
  }

  // 13. Event Listener Tema Suasana Background Meja
  if (themeSelectorBtn && themeMenu) {
    themeSelectorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      themeMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!themeMenu.contains(e.target) && e.target !== themeSelectorBtn) {
        themeMenu.classList.add('hidden');
      }
    });

    document.querySelectorAll('.theme-menu-item').forEach((item) => {
      item.addEventListener('click', () => {
        const selected = item.dataset.theme;
        applyTheme(selected, true);
        themeMenu.classList.add('hidden');
        showToast(`🎨 Suasana diubah ke ${themeLabels[selected]}!`);
      });
    });
  }

  document.querySelectorAll('.theme-card').forEach((card) => {
    card.addEventListener('click', () => {
      const selected = card.dataset.theme;
      applyTheme(selected, true);
    });
  });

  // Terapkan tema awal (Kabin Kayu Pinus)
  applyTheme('cabin');

  // Inisialisasi awal dengan foto contoh pertama
  currentConfig.imageDataUrl = generateSampleArtwork('sunset');
  loadPuzzleFromConfig(currentConfig);

  // Cek jika URL memiliki parameter ?room=KODE (Link undangan langsung)
  const params = new URLSearchParams(window.location.search);
  const invitedRoom = params.get('room');
  if (invitedRoom) {
    joinRoomInput.value = invitedRoom.toUpperCase();
    playerNameInput.value = 'Ayang';
  }
});
