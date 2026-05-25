/**
 * ACOUSTIC CORE - FX Engine
 * Visual Effects for Trade Events
 * Provides screen flashes, animations, confetti, P&L fly-ups
 */

class FXEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.confettiParticles = [];
    this.enabled = true;
  }

  init() {
    if (this.canvas) return;
    
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'fx-canvas';
    this.canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;';
    document.body.appendChild(this.canvas);
    
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  // Full screen flash
  flash(color, duration = 300) {
    if (!this.enabled) return;
    
    const flash = document.createElement('div');
    flash.style.cssText = `
      position:fixed;inset:0;pointer-events:none;z-index:9998;
      background:${color};transition:opacity ${duration}ms ease;
    `;
    document.body.appendChild(flash);
    
    requestAnimationFrame(() => {
      flash.style.opacity = '1';
      setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => flash.remove(), duration);
      }, 50);
    });
  }

  // Screen shake
  shake(element, duration = 400) {
    if (!element || !this.enabled) return;
    
    const original = element.style.transform;
    const shake = element.closest('.machine');
    
    let start = Date.now();
    const anim = () => {
      const elapsed = Date.now() - start;
      if (elapsed > duration) {
        element.style.transform = original || '';
        return;
      }
      
      const intensity = 1 - (elapsed / duration);
      const x = (Math.random() - 0.5) * 8 * intensity;
      const y = (Math.random() - 0.5) * 8 * intensity;
      element.style.transform = `translate(${x}px, ${y}px)`;
      
      requestAnimationFrame(anim);
    };
    
    anim();
  }

  // P&L value flies up from position
  pnlFlyUp(pnl, x, y) {
    if (!this.enabled || Math.abs(pnl) < 0.10) return;
    
    const el = document.createElement('div');
    const isWin = pnl > 0;
    el.textContent = (isWin ? '+' : '') + '$' + pnl.toFixed(2);
    el.style.cssText = `
      position:fixed;left:${x}px;top:${y}px;
      font-family:'Bungee',display;font-size:16px;font-weight:bold;
      color:${isWin ? 'var(--green)' : 'var(--hot)'};
      text-shadow:0 2px 8px rgba(0,0,0,0.5);
      pointer-events:none;z-index:9000;
      animation:pnlFly 1.5s ease forwards;
    `;
    document.body.appendChild(el);
    
    // Add keyframe if not exists
    if (!document.getElementById('fx-keyframes')) {
      const style = document.createElement('style');
      style.id = 'fx-keyframes';
      style.textContent = `
        @keyframes pnlFly {
          0% { transform:translateY(0) scale(1);opacity:1; }
          100% { transform:translateY(-100px) scale(1.2);opacity:0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    setTimeout(() => el.remove(), 1500);
  }

  // Confetti burst
  confetti(x, y, count = 20) {
    if (!this.enabled) return;
    
    this.init();
    
    const colors = ['#ffd700', '#00ffe7', '#39ff14', '#ff2d78', '#bf5fff'];
    const particles = [];
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 3 + Math.random() * 5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 4 + Math.random() * 6,
        color: color,
        life: 1,
        decay: 0.015 + Math.random() * 0.01
      });
    }
    
    this.confettiParticles.push(...particles);
    this.animateConfetti();
  }

  animateConfetti() {
    if (!this.ctx || this.confettiParticles.length === 0) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    const remaining = [];
    
    this.confettiParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // gravity
      p.life -= p.decay;
      
      if (p.life > 0) {
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = p.life;
        this.ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        remaining.push(p);
      }
    });
    
    this.confettiParticles = remaining;
    
    if (remaining.length > 0) {
      requestAnimationFrame(() => this.animateConfetti());
    } else {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  // Pulse effect on element
  pulse(element) {
    if (!element) return;
    element.style.animation = 'none';
    element.offsetHeight; // trigger reflow
    element.style.animation = 'fxPulse 0.4s ease';
    
    // Add keyframe if not exists
    if (!document.getElementById('fx-pulse-key')) {
      const style = document.createElement('style');
      style.id = 'fx-pulse-key';
      style.textContent = `
        @keyframes fxPulse {
          0% { transform:scale(1); }
          50% { transform:scale(1.1); }
          100% { transform:scale(1); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Disable all FX
  disable() {
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
  }
}

// Global instance
window.FX = new FXEngine();
