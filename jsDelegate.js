﻿var Delegate = (function () {
	"use strict";
	function bind(func, s) {
		return function () { return func.apply(s, arguments); };
	}
	function isDelegate(func) {
		return typeof func === "function" && func.curry === curry && typeof (func.push) === "function" && typeof (func.method) === "function";
	}
	function ensureDelegate(func) {
		if (typeof func !== "function")
			throw new Error("argument is not a function or delegate");
		return isDelegate(func) ? func : createDelegate(func, func);
	}

	function curry() {
		var preArgs = Array.prototype.slice.call(arguments);
		var delegate = this;
		return createDelegate(function () {
			return delegate.apply(this, preArgs.concat(Array.prototype.slice.call(arguments)));
		}, delegate.method);
	}

	function createDelegate(invoker, method, previous) {
		var d = function delegateFunc() {
			if (typeof previous === "function")
				previous.apply(this, arguments);
			return invoker.apply(this, arguments);
		};
		

		d.method = method;
		d.curry = curry;
		if (typeof previous === "function")
			d.previous = previous;
		d.prepend = function (prevDelegate) {
			if (!prevDelegate)
				return d;
			prevDelegate = ensureDelegate(prevDelegate);
			var newPrevious;

			//If this delegate is itself the head of a 
			//chain, clone the whole chain. Otherwise,
			//we can add this method to the new chain 
			//directly.
			if (typeof previous === "function")
				newPrevious = previous.push(prevDelegate);
			else
				newPrevious = prevDelegate;
			return createDelegate(invoker, method, newPrevious);
		};

		return d;
	}

	return {
		isDelegate: isDelegate,
		createOpen: function (method) {
			return createDelegate(method, method);
		},
		createOpenThis: function (method) {
			return createDelegate(bind(method.call, method), method);
		},
		createClosed: function (thisObj, method) {
			if (typeof method === "string")
				method = thisObj[method];
			return createDelegate(bind(method, thisObj), method);
		},
		combine: function () {
			var retVal = null;
			for (var i = 0; i < arguments.length; i++) {
				if (!arguments[i])
					continue;

				if (!retVal)
					retVal = ensureDelegate(arguments[i]);
				else
					retVal = ensureDelegate(arguments[i]).prepend(retVal);
			}
			return retVal;
		}
	};
})();