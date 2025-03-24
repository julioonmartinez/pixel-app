import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <div class="card" [class.clickable]="clickable" [class.elevated]="elevated">
      @if (title) {
        <div class="card-header">
          <h3>{{title}}</h3>
          @if (subtitle) {
            <p class="subtitle">{{subtitle}}</p>
          }
        </div>
      }
      <div class="card-content">
        <ng-content></ng-content>
      </div>
      @if (footer) {
        <div class="card-footer">
          {{footer}}
        </div>
      }
    </div>
  `,
  styleUrls: ['./card.component.scss']
})
export class CardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() footer?: string;
  @Input() clickable = false;
  @Input() elevated = true;
}
