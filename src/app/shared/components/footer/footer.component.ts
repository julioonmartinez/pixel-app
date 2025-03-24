import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <div class="footer-content">
        <div class="copyright">
          © {{currentYear}} PixelForge. Todos los derechos reservados.
        </div>
        <div class="links">
          <a href="#">Políticas de Privacidad</a>
          <a href="#">Términos de Servicio</a>
          <a href="#">Contacto</a>
        </div>
      </div>
    </footer>
  `,
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}