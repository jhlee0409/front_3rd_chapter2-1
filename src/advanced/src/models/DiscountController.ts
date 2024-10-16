import { PRODUCT_DISCOUNT_RULES, WEEKDAY_DISCOUNT_RATE } from "@/constants";
import { DiscountType, ProductOption } from "@/types";

//? 베이스가 되는 클래스를 만들어서 다형성있게?
//? 각 할인 타입에 따라 class를 생성해야 할까?

const BULK_DISCOUNT_RATE = 0.25;
const BULK_DISCOUNT_SIZE = 30;

class DiscountController {
  private _cartItems: ProductOption[];
  private _bulkRate: number;
  private _bulkSize: number;

  constructor(cartItems: ProductOption[]) {
    this._cartItems = cartItems;
    this._bulkRate = BULK_DISCOUNT_RATE;
    this._bulkSize = BULK_DISCOUNT_SIZE;
  }

  _getDiscountRate(productId: string, quantity: number) {
    const discountRule = PRODUCT_DISCOUNT_RULES[productId as keyof typeof PRODUCT_DISCOUNT_RULES];

    if (!discountRule) return 0;
    const { minQuantity, rate } = discountRule;
    const isOverMinQuantity = quantity >= minQuantity;
    const discountRate = isOverMinQuantity ? rate : 0;

    return discountRate;
  }

  getBulkSize() {
    return this._bulkSize;
  }

  _getOriginalTotalPrice() {
    return this._cartItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  }

  _calculateItemPrice(itemId: string, quantity: number) {
    const discountRate = this._getDiscountRate(itemId, quantity);
    const itemPrice = this._cartItems.find((item) => item.id === itemId)?.price ?? 0;
    const itemTotal = itemPrice * quantity;
    return itemTotal * (1 - discountRate);
  }

  _calculateTotalPrice() {
    if (this._cartItems.length === 0) return 0;
    return this._cartItems.reduce((acc, curr) => acc + this._calculateItemPrice(curr.id, curr.quantity), 0);
  }

  _calculateWeekdayDiscountPrice(weekday: keyof typeof WEEKDAY_DISCOUNT_RATE, totalPrice: number) {
    return totalPrice * (1 - WEEKDAY_DISCOUNT_RATE[weekday]);
  }

  _calculateBulkDiscountPrice(price: number) {
    return price * (1 - this._bulkRate);
  }

  _calculateOriginalPrice() {
    return {
      discountedTotalPrice: this._calculateTotalPrice(),
      discountRate: (this._getOriginalTotalPrice() - this._calculateTotalPrice()) / this._getOriginalTotalPrice(),
    };
  }

  _calculateBulk() {
    return {
      discountedTotalPrice: this._calculateBulkDiscountPrice(this._calculateTotalPrice()),
      discountRate: this._bulkRate,
    };
  }

  _calculateWeekday(weekday: keyof typeof WEEKDAY_DISCOUNT_RATE) {
    return {
      discountedTotalPrice: this._calculateWeekdayDiscountPrice(weekday, this._calculateTotalPrice()),
      discountRate: WEEKDAY_DISCOUNT_RATE[weekday as keyof typeof WEEKDAY_DISCOUNT_RATE],
    };
  }

  calculate(type?: DiscountType) {
    switch (type) {
      case "bulk":
        return this._calculateBulk();
      case "weekday":
        return this._calculateWeekday(new Date().getDay() as keyof typeof WEEKDAY_DISCOUNT_RATE);
      case "noItem":
        return { discountedTotalPrice: 0, discountRate: 0 };
      case "default":
        return this._calculateOriginalPrice();
      default:
        return this._calculateOriginalPrice();
    }
  }
}

export default DiscountController;
