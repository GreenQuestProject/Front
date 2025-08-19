import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'translateCategory',
  standalone: true
})
export class TranslateCategoryPipe implements PipeTransform {

  transform(category: string): string {
    switch (category) {
      case 'health':
        return 'Santé';
      case 'education':
        return 'Éducation';
      case 'ecology':
        return 'Écologie';
      case 'community':
        return 'Communeauté';
      case 'none':
        return 'Aucune';
      case 'personal_development':
        return 'Développement personnel';
      default:
        return category;
    }
  }

}
