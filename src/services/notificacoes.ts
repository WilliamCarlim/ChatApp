class NotificacoesService {
  private permissionGranted: boolean = false;

  async solicitarPermissao() {
    console.log('[Notificações] Verificando suporte a notificações...');
    
    if (!('Notification' in window)) {
      console.error('[Notificações] Este navegador não suporta notificações');
      return false;
    }

    if (Notification.permission === 'granted') {
      console.log('[Notificações] Permissão já concedida');
      this.permissionGranted = true;
      return true;
    }

    if (Notification.permission !== 'denied') {
      console.log('[Notificações] Solicitando permissão...');
      const permission = await Notification.requestPermission();
      console.log('[Notificações] Resposta da permissão:', permission);
      this.permissionGranted = permission === 'granted';
      return this.permissionGranted;
    }

    console.error('[Notificações] Permissão negada pelo usuário');
    return false;
  }

  async mostrarNotificacao(titulo: string, corpo: string, icone?: string) {
    console.log('[Notificações] Tentando mostrar notificação:', { titulo, corpo });
    
    if (!this.permissionGranted) {
      console.log('[Notificações] Permissão não concedida, solicitando...');
      await this.solicitarPermissao();
    }

    if (this.permissionGranted) {
      try {
        const options: NotificationOptions = {
          body: corpo,
          icon: icone || '/favicon.ico',
          badge: '/favicon.ico',
          vibrate: [200, 100, 200],
          tag: 'nova-mensagem',
          requireInteraction: true // Mantém a notificação visível até o usuário interagir
        };

        console.log('[Notificações] Criando notificação com opções:', options);
        const notification = new Notification(titulo, options);
        
        notification.onclick = () => {
          console.log('[Notificações] Notificação clicada');
          window.focus();
        };

        return true;
      } catch (error) {
        console.error('[Notificações] Erro ao criar notificação:', error);
        return false;
      }
    }

    console.log('[Notificações] Não foi possível mostrar notificação - permissão não concedida');
    return false;
  }

  async notificarNovaMensagem(remetenteNome: string, mensagemTexto: string) {
    console.log('[Notificações] Nova mensagem recebida:', { remetenteNome, mensagemTexto });
    return await this.mostrarNotificacao(
      `Nova mensagem de ${remetenteNome}`,
      mensagemTexto
    );
  }
}

export const notificacoesService = new NotificacoesService(); 