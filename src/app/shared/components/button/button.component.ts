// src/app/shared/components/button/button.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  template: `
    <button 
      [class]="'btn ' + variant" 
      [disabled]="disabled || loading"
      (click)="onClick.emit($event)"
    >
      @if (loading) {
        <span class="loader"></span>
      }
      @if (iconLeft) {
        <span class="icon icon-left" [innerHTML]="iconLeft"></span>
      }
      <span class="btn-text"><ng-content></ng-content></span>
      @if (iconRight) {
        <span class="icon icon-right" [innerHTML]="iconRight"></span>
      }
    </button>
  `,
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'text' = 'primary';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() iconLeft?: string;
  @Input() iconRight?: string;
  
  @Output() onClick = new EventEmitter<MouseEvent>();
}