import { Component, OnInit } from '@angular/core';

import { ProductService } from '../product.service';
import { ProductCategoryService } from 'src/app/product-categories/product-category.service';

@Component({
    templateUrl: './product-shell.component.html'
})
export class ProductShellComponent implements OnInit {
    pageTitle: string = 'Products';

    constructor(private productService: ProductService,
        private productCategoryService: ProductCategoryService) { }

    ngOnInit(): void {
        // Set up the product services
        // Don't need to subscribe due to async pipe
        this.productService.start();
    }
}
