import { Component, OnInit } from '@angular/core';

import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ProductService } from '../product.service';
import { Product } from '../product';
import { Supplier } from '../../suppliers/supplier';

@Component({
    selector: 'pm-product-detail',
    templateUrl: './product-detail.component.html'
})
export class ProductDetailComponent implements OnInit {
    pageTitle: string = 'Product Detail';

    product$: Observable<Product | null>;
    selectedProductId$: Observable<number | null>
    suppliers: Supplier[] = [];
    errorMessage: string;

    constructor(private productService: ProductService) { }

    ngOnInit() {
        // Watch for changes to the selected product
        // Get the selected product and display the appropriate heading
        this.selectedProductId$ = this.productService.selectedProductChanges$
            .pipe(
                tap(() => this.product$ = this.productService.selectedProduct$)
            )
    }

    displayProduct(product: Product): void {
        // Display the appropriate heading
        if (product) {
            this.pageTitle = `Product Detail for: ${product.productName}`;
        } else {
            this.pageTitle = 'No product found';
        }
    }

}
