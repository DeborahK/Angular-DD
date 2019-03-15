import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { ProductListComponent } from './product-list/product-list.component';
import { ProductDetailComponent } from './product-detail/product-detail.component';
import { ProductShellComponent } from './product-shell/product-shell.component';

import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    SharedModule,
    ReactiveFormsModule,
    RouterModule.forChild([
      {
        path: '',
        component: ProductShellComponent
      },
      {
        path: ':id',
        component: ProductShellComponent
      }
    ])
  ],
  declarations: [
    ProductShellComponent,
    ProductListComponent,
    ProductDetailComponent
  ]
})
export class ProductModule { }
