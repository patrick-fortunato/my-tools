import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TOOL_CATEGORIES, ToolCategory } from '../shared/tool-registry';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  categories: ToolCategory[] = TOOL_CATEGORIES;
}
