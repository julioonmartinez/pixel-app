// src/app/shared/components/modal/modal.component.ts
import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div *ngIf="isOpen" class="modal-backdrop" (click)="closeOnBackdrop($event)">
      <div class="modal-content" [ngClass]="{'modal-content--large': size === 'large'}">
        <div class="modal-header">
          <h2 class="modal-title">{{ title }}</h2>
          <button class="modal-close" (click)="close.emit()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <ng-content></ng-content>
        </div>
        <div *ngIf="showFooter" class="modal-footer">
          <app-button 
            *ngIf="showCancelButton" 
            variant="secondary" 
            (onClick)="close.emit()"
          >
            {{ cancelText }}
          </app-button>
          <app-button 
            *ngIf="showConfirmButton" 
            variant="primary" 
            (onClick)="confirm.emit()"
          >
            {{ confirmText }}
          </app-button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() size: 'medium' | 'large' = 'medium';
  @Input() showFooter = true;
  @Input() showCancelButton = true;
  @Input() showConfirmButton = true;
  @Input() cancelText = 'Cancelar';
  @Input() confirmText = 'Aceptar';
  @Input() closeOnOutsideClick = true;
  
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
  
  @HostListener('document:keydown.escape')
  onEscapePress() {
    if (this.isOpen) {
      this.close.emit();
    }
  }
  
  closeOnBackdrop(event: MouseEvent) {
    // Solo cierra si se hace clic en el backdrop, no en el contenido
    if (this.closeOnOutsideClick && event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}