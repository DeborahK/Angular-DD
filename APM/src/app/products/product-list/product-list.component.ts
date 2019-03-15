import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { of, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Product } from '../product';
import { ProductService } from '../product.service';


@Component({
  selector: 'pm-product-list',
  templateUrl: './product-list.component.html'
})
export class ProductListComponent implements OnInit {
  pageTitle: string = 'Products';
  errorMessage: string;
  products$: Observable<Product[]>;
  selectedProductId$: Observable<number | null>;

  constructor(private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService) { }

  ngOnInit(): void {
    // Read the parameter from the route
    // A route parameter will be present when deep linking
    const productId = +this.route.paramMap.subscribe(
      params => {
        const id = +params.get('id');
        this.productService.changeSelectedProduct(id);
      }
    )

    this.selectedProductId$ = this.productService.selectedProductChanges$;

    this.products$ = this.productService.getProductsWithCategory()
      .pipe(
        catchError(error => {
          this.errorMessage = error;
          return of(null)
        })
      );
  }

  onSelected(productId: number): void {
      // Modify the URL to support deep linking
    this.router.navigate(['/products', productId]);
  }

}
