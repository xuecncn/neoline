import {
    AfterViewChecked,
    Component,
    ElementRef,
    Input,
    OnChanges,
    OnInit,
    ViewChild,
    OnDestroy
} from '@angular/core';
import {
    Router
} from '@angular/router';

import {
    switchMap,
    map
} from 'rxjs/operators';

import {
    Balance
} from '@models/models';
import {
    AssetState,
    NeonService,
    GlobalService,
    ChromeService
} from '@app/core';

import {
    FilterBarService
} from '@popup/_services/filter-bar.service';
import { Unsubscribable } from 'rxjs';

@Component({
    selector: 'app-filter-bar',
    templateUrl: 'filter-bar.component.html',
    styleUrls: ['filter-bar.component.scss']
})
export class PopupHomeFilterBarComponent
implements OnChanges, OnInit, AfterViewChecked, OnDestroy {
    @Input() initAssetId: string;

    @ViewChild('more') more: ElementRef;
    @ViewChild('symbolFilter') symbolFilter: ElementRef;

    public address: string;
    public balances: Balance[];
    public currentAssetId: string;
    public loading: boolean;
    public loadingIndex: number;
    public isInit: boolean;
    public watch: Balance[];

    public moreStyle: any;

    private filterContainerScrollWidth: number;
    private filterMargin: number;
    selectedFilterIndex: number;
    private moreStyleTop: number;
    private topHeight: number;
    moreOpen: boolean;
    public unSubBalance: Unsubscribable;

    constructor(
        private asset: AssetState,
        private neon: NeonService,
        private global: GlobalService,
        private chrome: ChromeService,
        private filterBar: FilterBarService,
        private router: Router
    ) {
        this.address = '';
        this.balances = [];
        this.currentAssetId = '';
        this.loading = true;
        this.isInit = true;

        this.moreStyle = {};

        this.filterContainerScrollWidth = 275;
        this.selectedFilterIndex = 0;
        this.topHeight = 103;
        this.moreOpen = false;
        this.filterMargin = 10;
    }

    ngOnInit() {
        this.filterBar.needLoad.subscribe((res: any) => {
            if (this.isInit) {
                setTimeout(() => {
                    this.loading = res;
                    this.isInit = false;
                }, 500);
            } else {
                this.loading = res;
            }
        });
        this.address = this.neon.address;
        this.unSubBalance = this.asset.balanceSub$.subscribe(balanceArr => {
            this.handlerBalance(balanceArr);
        });
        this.asset.fetchBalance(this.neon.address).subscribe(balanceArr => {
            this.handlerBalance(balanceArr);
        });
    }

    ngOnDestroy(): void {
        if (this.unSubBalance) {
            this.unSubBalance.unsubscribe();
        }
    }

    ngOnChanges() {
        // this.getBalance();
    }

    public handlerBalance(balanceRes: Balance[]) {
        this.balances = [];
        this.balances.push(...balanceRes);
        this.chrome.getWatch().subscribe(watching => {
            const newWatch = [];
            watching.forEach((w) => {
                if (balanceRes.findIndex((r) => r.asset_id === w.asset_id) < 0) {
                    newWatch.push(w);
                }
            });
            this.watch = newWatch;
            this.balances.push(...newWatch);
            this.initSelectedAsset();
        });
    }

    private initSelectedAsset() {
        if (this.initAssetId && this.balances) {
            for (let i = 0; i < this.balances.length; i++) {
                if (this.balances[i].asset_id === this.initAssetId) {
                    this.selectedFilterIndex = i;
                    break;
                }
            }
        }
    }

    ngAfterViewChecked(): void {
        const moreHeight = this.more.nativeElement.scrollHeight;
        this.moreStyleTop = this.topHeight - moreHeight;

        this.moreStyle = {
            top: `${ this.moreStyleTop }px`
        };
    }

    public toggleMore() {
        if (this.loading && !this.moreOpen) {
            return;
        }

        const toggleMoreStyleTop = !this.moreOpen ? this.topHeight : this.moreStyleTop;

        this.moreStyle = {
            top: `${ toggleMoreStyleTop }px`
        };

        this.moreOpen = !this.moreOpen;
    }

    public changeFilter(index: number, assetId: string, needScroll: boolean = false) {
        if (this.loading || this.selectedFilterIndex === index) {
            return;
        }

        if (this.currentAssetId === assetId) {
            return;
        }

        this.loading = true;

        this.loadingIndex = index;

        this.selectedFilterIndex = index;

        let scrollLeft = 0;

        for (let i = 0; i < index; i++) {
            scrollLeft += this.symbolFilter.nativeElement.children[i].scrollWidth + this.filterMargin;
        }

        if (needScroll) {
            this.symbolFilter.nativeElement.scrollLeft = scrollLeft;
        }

        if (this.moreOpen) {
            this.toggleMore();
        }

        this.currentAssetId = assetId;
        this.filterBar.needLoad.emit(true);

        this.router.navigateByUrl(`/popup/home/${ assetId }`);
    }

    public filtersClassName(index: number) {
        const activeClassName = index === this.selectedFilterIndex ?
            'popup-home-top-filter-active' :
            '';

        const loadingClassName = this.loading && this.loadingIndex === index ?
            'popup-home-top-filter-loading' :
            '';

        const hoverClassName = !this.loading ?
            'popup-home-top-filter-hover' :
            '';

        return `${ activeClassName } ${ loadingClassName } ${ hoverClassName }`;
    }

    public moreClassName() {
        if (this.isInit) {
            return !this.loading && this.isInit ?
                'popup-home-more-display' :
                '';
        } else {
            return 'popup-home-more-display';
        }
    }
}
