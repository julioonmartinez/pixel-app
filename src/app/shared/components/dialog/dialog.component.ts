// src/app/shared/components/dialog/dialog.component.ts
import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" (click)="onOverlayClick($event)">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ title }}</h3>
          <button class="close-btn" (click)="close.emit()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./dialog.component.scss']
})
export class DialogComponent {
  @Input() title: string = 'Diálogo';
  @Output() close = new EventEmitter<void>();
  
  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    this.close.emit();
  }
  
  onOverlayClick(event: MouseEvent): void {
    // Solo cerrar si se hizo clic directamente en el overlay, no en sus hijos
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }
}