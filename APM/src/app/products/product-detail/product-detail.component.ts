import { Component, OnInit, OnDestroy } from '@angular/core';

import { Subscription } from 'rxjs';

import { ProductService } from '../product.service';
import { Product } from '../product';
import { Supplier } from '../../suppliers/supplier';

@Component({
    selector: 'pm-product-detail',
    templateUrl: './product-detail.component.html'
})
export class ProductDetailComponent implements OnInit, OnDestroy {
    pageTitle: string = 'Product Detail';

    product: Product | null;
    sub: Subscription;
    suppliers: Supplier[] = [];
    errorMessage: string;

    constructor(private productService: ProductService) { }

    ngOnInit() {
        this.sub = this.productService.selectedProductChanges$.subscribe(
            selectedProduct => {
                this.product = selectedProduct;
                this.displayProduct(this.product);
            }
        );
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
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
