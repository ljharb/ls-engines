// Override `Array.isArray` so it narrows to the operand's own array type rather
// than widening to `any[]`, losing the element type.
// See https://github.com/microsoft/TypeScript/issues/15722

interface ArrayConstructor {
	isArray<T>(arg: T): arg is T & readonly unknown[];
}
