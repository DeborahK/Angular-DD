import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Product } from '../product';
import { ProductService } from '../product.service';
import { Supplier } from '../../suppliers/supplier';
import { SupplierService } from '../../suppliers/supplier.service';

import { mergeMap, tap, map, switchMap } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

@Component({
  templateUrl: './product-suppliers.component.html'
})
export class ProductSuppliersComponent implements OnInit {
  pageTitle = 'Product Suppliers';
  product: Product;
  suppliers: Supplier[] = [];
  errorMessage: string;

  constructor(private route: ActivatedRoute,
    private productService: ProductService,
    private supplierService: SupplierService) { }

  ngOnInit(): void {
    // Read the parameter from the route
    const id = +this.route.snapshot.paramMap.get('id');

    // AntiPattern: Nested subscriptions
    // Get the product
    // For each supplier, get the supplier and add it to the array
    // this.productService.getProduct(id).subscribe(
    //   product => {
    //     this.product = product;
    //     this.displayProduct(product);
    //     product.supplierIds.map(supplierId => {
    //       this.supplierService.getSupplier(supplierId).subscribe(
    //         suppliers => this.suppliers.push(suppliers),
    //         error => this.errorMessage = error
    //       )
    //     })
    //   },
    //   error => this.errorMessage = error
    // );

    // Displays each type of data without waiting
    // this.productService.getProduct(id).pipe(
    //   tap(product => this.product = product),
    //   mergeMap(product => this.productService.getProductSuppliers(id))
    // ).subscribe(
    //   suppliers => this.suppliers = suppliers,
    //   error => this.errorMessage = error
    // );

    // Displays each type of data without waiting
    // this.productService.getProduct(id).pipe(
    //   tap(product => this.product = product),
    //   mergeMap(() => this.productService.getProductSuppliersOneByOne(id))
    // ).subscribe(
    //   supplier => this.suppliers.push(supplier),
    //   error => this.errorMessage = error
    // );

    // From BL
    this.productService.getProduct(id).pipe(
      tap(product => {
        this.product = product;
        this.displayProduct(product);
      }),
      mergeMap(() => this.supplierService.getSupplier(id))
    ).subscribe(
      supplier => { this.suppliers.push(supplier); },
      err => { this.errorMessage = err; },
    );

    // Waits for all of the data before displaying any
    // const product$ = this.productService.getProduct(id);
    // const suppliers$ = this.productService.getProductSuppliers(id);
    // forkJoin([product$, suppliers$])
    //   .subscribe(([product, suppliers]) => {
    //     this.product = product;
    //     this.suppliers = suppliers;
    //   });

  }

  displayProduct(product: Product): void {
    // Display the appropriate heading
    if (product) {
      this.pageTitle = `Product Suppliers for: ${product.productName}`;
    } else {
      this.pageTitle = 'No product found';
    }
  }
}
