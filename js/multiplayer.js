// Modul Multiplayer Real-Time menggunakan PeerJS (WebRTC DataChannel) + BroadcastChannel Fallback

class PuzzleMultiplayer {
  constructor(handlers = {}) {
    this.handlers = handlers;
    this.peer = null;
    this.conn = null;
    this.role = null; // 'host' | 'guest' | 'solo'
    this.roomCode = null;
    this.myName = 'Sayang';
    this.partnerName = 'Pacar';
    this.isConnected = false;

    // Throttle cursor & drag updates
    this.lastCursorSend = 0;
    this.lastDragSend = 0;

    // BroadcastChannel untuk pengujian instan antar 2 tab di browser yang sama
    this.bc = null;
    try {
      this.bc = new BroadcastChannel('couple-jigsaw-puzzle-channel');
      this.bc.onmessage = (e) => this.handleIncomingMessage(e.data, 'bc');
    } catch (err) {
      console.warn('BroadcastChannel not supported', err);
    }
  }

  getPrefix() {
    return 'puzzlekita-';
  }

  cleanCode(code) {
    return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  createRoom(customCode, myName) {
    this.role = 'host';
    this.myName = myName || 'Sayang';
    const code = customCode ? this.cleanCode(customCode) : Math.random().toString(36).substring(2, 8).toUpperCase();
    this.roomCode = code;

    const peerId = this.getPrefix() + code + '-host';

    if (window.Peer) {
      try {
        this.peer = new window.Peer(peerId, { debug: 1 });

        this.peer.on('open', (id) => {
          console.log('Peer Host opened:', id);
          if (this.handlers.onRoomReady) {
            this.handlers.onRoomReady(this.roomCode);
          }
        });

        this.peer.on('connection', (connection) => {
          this.setupConnection(connection);
        });

        this.peer.on('error', (err) => {
          console.warn('Peer host error:', err);
          if (err.type === 'unavailable-id') {
            if (this.handlers.onError) {
              this.handlers.onError('Kode room tersebut sudah dipakai atau sedang aktif. Coba gunakan kode lain ya!');
            }
          }
        });
      } catch (err) {
        console.error('Peer init error:', err);
      }
    }

    if (this.handlers.onRoomReady) {
      this.handlers.onRoomReady(this.roomCode);
    }
  }

  joinRoom(targetCode, myName) {
    this.role = 'guest';
    this.myName = myName || 'Pacar';
    const code = this.cleanCode(targetCode);
    this.roomCode = code;

    const hostPeerId = this.getPrefix() + code + '-host';
    const myPeerId = this.getPrefix() + code + '-guest-' + Math.floor(Math.random() * 1000);

    if (window.Peer) {
      try {
        this.peer = new window.Peer(myPeerId, { debug: 1 });

        this.peer.on('open', () => {
          console.log('Connecting to host:', hostPeerId);
          const connection = this.peer.connect(hostPeerId, { reliable: true });
          this.setupConnection(connection);
        });

        this.peer.on('error', (err) => {
          console.warn('Peer guest error:', err);
          if (this.handlers.onError) {
            this.handlers.onError('Gagal terhubung ke Host. Pastikan pembuat room sudah membuka permainannya!');
          }
        });
      } catch (err) {
        console.error('Peer init error:', err);
      }
    }

    // Beritahu tab host melalui BroadcastChannel jika di browser yang sama
    this.sendViaBC({ type: 'GUEST_JOIN_REQUEST', roomCode: code, guestName: this.myName });
  }

  setupConnection(connection) {
    this.conn = connection;

    this.conn.on('open', () => {
      console.log('Peer DataChannel Connected!');
      this.isConnected = true;

      // Kirim salam perkenalan nama
      this.send({ type: 'HANDSHAKE', name: this.myName });

      if (this.handlers.onConnected) {
        this.handlers.onConnected();
      }
    });

    this.conn.on('data', (data) => {
      this.handleIncomingMessage(data, 'webrtc');
    });

    this.conn.on('close', () => {
      this.isConnected = false;
      if (this.handlers.onDisconnected) {
        this.handlers.onDisconnected();
      }
    });

    this.conn.on('error', (err) => {
      console.warn('Connection error:', err);
    });
  }

  send(data) {
    if (this.conn && this.conn.open) {
      try {
        this.conn.send(data);
      } catch (e) {
        console.warn('Failed to send via webrtc:', e);
      }
    }
    this.sendViaBC(data);
  }

  sendViaBC(data) {
    if (this.bc) {
      try {
        this.bc.postMessage({ ...data, _roomCode: this.roomCode, _senderRole: this.role });
      } catch (e) {
        // Abaikan jika payload gambar terlalu besar untuk BC
      }
    }
  }

  handleIncomingMessage(data, source) {
    if (!data || !data.type) return;

    // Filter broadcast channel jika berasal dari room berbeda
    if (source === 'bc' && data._roomCode && this.roomCode && data._roomCode !== this.roomCode) {
      return;
    }
    if (source === 'bc' && data._senderRole && data._senderRole === this.role) {
      return; // Jangan memproses pesan dari diri sendiri
    }

    switch (data.type) {
      case 'HANDSHAKE':
        this.partnerName = data.name || 'Pacar';
        this.isConnected = true;
        if (this.handlers.onPartnerJoined) {
          this.handlers.onPartnerJoined(this.partnerName);
        }
        // Jika kita host dan partner baru saja bergabung, kirim konfigurasi puzzle saat ini
        if (this.role === 'host' && this.handlers.onHostNeedsToSendPuzzle) {
          this.handlers.onHostNeedsToSendPuzzle();
        }
        break;

      case 'GUEST_JOIN_REQUEST':
        if (this.role === 'host' && this.handlers.onHostNeedsToSendPuzzle) {
          this.partnerName = data.guestName || 'Pacar';
          this.isConnected = true;
          if (this.handlers.onPartnerJoined) {
            this.handlers.onPartnerJoined(this.partnerName);
          }
          this.handlers.onHostNeedsToSendPuzzle();
        }
        break;

      case 'INIT_PUZZLE':
        if (this.handlers.onReceivePuzzleInit) {
          this.handlers.onReceivePuzzleInit(data);
        }
        break;

      case 'CURSOR':
        if (this.handlers.onPartnerCursor) {
          this.handlers.onPartnerCursor(data.x, data.y, this.partnerName);
        }
        break;

      case 'DRAG_PIECES':
        if (this.handlers.onPartnerDragPieces) {
          this.handlers.onPartnerDragPieces(data.updates);
        }
        break;

      case 'DROP_PIECES':
        if (this.handlers.onPartnerDropPieces) {
          this.handlers.onPartnerDropPieces(data.updates);
        }
        break;

      case 'ORGANIZE_PIECES':
        if (this.handlers.onPartnerOrganizePieces) {
          this.handlers.onPartnerOrganizePieces(data.updates);
        }
        break;

      case 'REACTION_EMOJI':
        if (this.handlers.onReceiveEmoji) {
          this.handlers.onReceiveEmoji(data.emoji, data.sender || this.partnerName);
        }
        break;

      case 'VICTORY_REVEAL':
        if (this.handlers.onReceiveVictory) {
          this.handlers.onReceiveVictory(data);
        }
        break;

      case 'CHANGE_THEME':
        if (this.handlers.onPartnerChangeTheme) {
          this.handlers.onPartnerChangeTheme(data.theme);
        }
        break;
    }
  }

  sendCursor(x, y) {
    const now = Date.now();
    if (now - this.lastCursorSend > 50) {
      this.lastCursorSend = now;
      this.send({ type: 'CURSOR', x, y });
    }
  }

  sendDrag(updates) {
    const now = Date.now();
    if (now - this.lastDragSend > 40) {
      this.lastDragSend = now;
      this.send({ type: 'DRAG_PIECES', updates });
    }
  }

  sendDrop(updates) {
    this.send({ type: 'DROP_PIECES', updates });
  }

  sendOrganize(updates) {
    this.send({ type: 'ORGANIZE_PIECES', updates });
  }

  sendEmoji(emoji) {
    this.send({ type: 'REACTION_EMOJI', emoji, sender: this.myName });
  }

  sendTheme(theme) {
    this.send({ type: 'CHANGE_THEME', theme });
  }
}

window.PuzzleMultiplayer = PuzzleMultiplayer;
