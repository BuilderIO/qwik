#![allow(unused_must_use)]

use super::*;
use serde_json::to_string_pretty;

macro_rules! test_input {
	($input: expr) => {
		let input = $input;
		let strip_exports: Option<Vec<JsWord>> = input
			.strip_exports
			.map(|v| v.into_iter().map(|s| JsWord::from(s)).collect());

		let reg_ctx_name: Option<Vec<JsWord>> = input
			.reg_ctx_name
			.map(|v| v.into_iter().map(|s| JsWord::from(s)).collect());

		let strip_ctx_name: Option<Vec<JsWord>> = input
			.strip_ctx_name
			.map(|v| v.into_iter().map(|s| JsWord::from(s)).collect());

		let res = transform_modules(TransformModulesOptions {
			src_dir: input.src_dir,
			root_dir: input.root_dir,
			input: vec![TransformModuleInput {
				code: input.code.clone(),
				path: input.filename,
			}],
			source_maps: true,
			minify: input.minify,
			transpile_ts: input.transpile_ts,
			transpile_jsx: input.transpile_jsx,
			preserve_filenames: input.preserve_filenames,
			explicit_extensions: input.explicit_extensions,
			manual_chunks: input.manual_chunks,
			entry_strategy: input.entry_strategy,
			mode: input.mode,
			scope: input.scope,
			core_module: input.core_module,
			strip_exports,
			strip_ctx_name,
			reg_ctx_name,
			strip_event_handlers: input.strip_event_handlers,
			is_server: input.is_server,
		});
		if input.snapshot {
			let input = input.code.to_string();
			let output = format!("==INPUT==\n\n{}", input);
			snapshot_res!(&res, output);
		}
		drop(res)
	};
}

macro_rules! snapshot_res {
	($res: expr, $prefix: expr) => {
		match $res {
			Ok(v) => {
				let mut output: String = $prefix;

				for module in &v.modules {
					let is_entry = if module.is_entry { "(ENTRY POINT)" } else { "" };
					output += format!(
						"\n============================= {} {}==\n\n{}\n\n{:?}",
						module.path, is_entry, module.code, module.map
					)
					.as_str();
					if let Some(hook) = &module.hook {
						let hook = to_string_pretty(&hook).unwrap();
						output += &format!("\n/*\n{}\n*/", hook);
					}
					// let map = if let Some(map) = s.map { map } else { "".to_string() };
					// output += format!("\n== MAP ==\n{}", map).as_str();
				}
				output += format!(
					"\n== DIAGNOSTICS ==\n\n{}",
					to_string_pretty(&v.diagnostics).unwrap()
				)
				.as_str();
				insta::assert_snapshot!(output);
			}
			Err(err) => {
				insta::assert_snapshot!(err);
			}
		}
	};
}

#[test]
fn example_1() {
	test_input!(TestInput {
		code: r#"
import { $, component, onRender } from '@builder.io/qwik';

export const renderHeader = $(() => {
    return (
        <div onClick={$((ctx) => console.log(ctx))}/>
    );
});
const renderHeader = component($(() => {
  console.log("mount");
  return render;
}));
"#
		.to_string(),
		..TestInput::default()
	});
}

#[test]
fn example_2() {
	test_input!(TestInput {
		code: r#"
import { $, component$ } from '@builder.io/qwik';
export const Header = component$(() => {
    console.log("mount");
    return (
        <div onClick={$((ctx) => console.log(ctx))}/>
    );
});
"#
		.to_string(),
		..TestInput::default()
	});
}

#[test]
fn example_3() {
	test_input!(TestInput {
		code: r#"
import { $, component$ } from '@builder.io/qwik';
export const App = () => {
    const Header = component$(() => {
        console.log("mount");
        return (
            <div onClick={$((ctx) => console.log(ctx))}/>
        );
    });
    return Header;
});
"#
		.to_string(),
		..TestInput::default()
	});
}

#[test]
fn example_4() {
	test_input!(TestInput {
		code: r#"
import { $, component$ } from '@builder.io/qwik';
export function App() {
    const Header = component$(() => {
        console.log("mount");
        return (
            <div onClick={$((ctx) => console.log(ctx))}/>
        );
    });
    return Header;
}
"#
		.to_string(),
		..TestInput::default()
	});
}

#[test]
fn example_5() {
	test_input!(TestInput {
		code: r#"
import { $, component$ } from '@builder.io/qwik';
export const Header = component$(() => {
    return (
        <>
            <div onClick={(ctx) => console.log("1")}/>
            <div onClick={$((ctx) => console.log("2"))}/>
        </>
    );
});
"#
		.to_string(),
		..TestInput::default()
	});
}

#[test]
fn example_6() {
	test_input!(TestInput {
		code: r#"
import { $, component$ } from '@builder.io/qwik';
export const sym1 = $((ctx) => console.log("1"));
"#
		.to_string(),
		..TestInput::default()
	});
}

#[test]
fn example_7() {
	test_input!(TestInput {
		code: r#"
import { $, component$ } from '@builder.io/qwik';

export const Header = component$(() => {
    console.log("mount");
    return (
        <div onClick={$((ctx) => console.log(ctx))}/>
    );
  });

const App = component$(() => {
    return (
        <Header/>
    );
});
"#
		.to_string(),
		..TestInput::default()
	});
}

#[test]
fn example_8() {
	test_input!(TestInput {
		code: r#"
import { $, component$ } from '@builder.io/qwik';

export const Header = component$(() => {
    return $((hola) => {
        const hola = this;
        const {something, styff} = hola;
        const hello = hola.nothere.stuff[global];
        return (
            <Header/>
        );
    });
});
"#
		.to_string(),
		..TestInput::default()
	});
}

#[test]
fn example_9() {
	test_input!(TestInput {
		code: r#"
import { $, component$ } from '@builder.io/qwik';
const Header = $((decl1, {decl2}, [decl3]) => {
    const {decl4, key: decl5} = this;
    let [decl6, ...decl7] = stuff;
    const decl8 = 1, decl9;
    function decl10(decl11, {decl12}, [decl13]) {}
    class decl14 {
        method(decl15, {decl16}, [decl17]) {}
    }
    try{}catch(decl18){}
    try{}catch({decl19}){}
});
"#
		.to_string(),
		..TestInput::default()
	});
}

#[test]
fn example_10() {
	test_input!(TestInput {
		filename: "project/test.tsx".to_string(),
		code: r#"
import { $, component$ } from '@builder.io/qwik';
const Header = $((decl1, {decl2}, [decl3]) => {

    const hola = ident1.no;
    ident2;
    const a = ident1 + ident3;
    const b = ident1 + ident3;
    ident4(ident5, [ident6], {ident7}, {key: ident8});
    class Some {
        prop = ident9;
        method() {
            return ident10;
        }
    }

    return (
        <div onClick={(ident11) => ident11 + ident12} required={false}/>
    )
});
"#
		.to_string(),
		..TestInput::default()
	});
}

#[test]
fn example_11() {
	test_input!(TestInput {
		filename: "project/test.tsx".to_string(),
		code: r#"
import { $, component$ } from '@builder.io/qwik';
import {foo, bar as bbar} from "../state";
import * as dep2 from "dep2";
import dep3 from "dep3/something";

export const Header = component$(() => {
    return (
        <Header onClick={$((ev) => dep3(ev))}>
            {dep2.stuff()}{bbar()}
        </Header>
    );
});

export const App = component$(() => {
    return (
        <Header>{foo()}</Header>
    );
});
"#
		.to_string(),
		entry_strategy: EntryStrategy::Single,
		..TestInput::default()
	});
}

#[test]
fn example_functional_component() {
	test_input!(TestInput {
		code: r#"
import { $, component$, useStore } from '@builder.io/qwik';
const Header = component$(() => {
    const thing = useStore();
    const {foo, bar} = foo();

    return (
        <div>{thing}</div>
    );
});
"#
		.to_string(),
		minify: MinifyMode::None,
		..TestInput::default()
	});
}

#[test]
fn example_functional_component_2() {
	test_input!(TestInput {
		code: r#"
import { $, component$, useStore } from '@builder.io/qwik';
export const useCounter = () => {
    return useStore({count: 0});
}

export const STEP = 1;

export const App = component$((props) => {
    const state = useCounter();
    const thing = useStore({thing: 0});
    const STEP_2 = 2;

    const count2 = state.count * 2;
    return (
        <div onClick$={() => state.count+=count2 }>
            <span>{state.count}</span>
            {buttons.map(btn => (
                <button
                    onClick$={() => state.count += btn.offset + thing + STEP + STEP_2 + props.step}
                >
                    {btn.name}
                </button>
            ))}

        </div>

    );
})
"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}

#[test]
fn example_functional_component_capture_props() {
	test_input!(TestInput {
		code: r#"
import { $, component$, useStore } from '@builder.io/qwik';

export const App = component$(({count, rest: [I2, {I3, v1: [I4], I5=v2, ...I6}, I7=v3, ...I8]}) => {
    const state = useStore({count: 0});
    const {rest: [C2, {C3, v1: [C4], C5=v2, ...C6}, C7=v3, ...C8]} = foo();
    return $(() => {
        return (
            <div onClick$={() => state.count += count + total }>
                {I2}{I3}{I4}{I5}{I6}{I7}{I8}
                {C2}{C3}{C4}{C5}{C6}{C7}{C8}
                {v1}{v2}{v3}
            </div>
        )
    });
})
"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}

#[test]
fn example_multi_capture() {
	test_input!(TestInput {
		code: r#"
import { $, component$ } from '@builder.io/qwik';

export const Foo = component$(({foo}) => {
    const arg0 = 20;
    return $(() => {
        const fn = ({aaa}) => aaa;
        return (
            <div>
              {foo}{fn()}{arg0}
            </div>
        )
    });
})

export const Bar = component$(({bar}) => {
    return $(() => {
        return (
            <div>
              {bar}
            </div>
        )
    });
})
"#
		.to_string(),
		transpile_ts: true,
		..TestInput::default()
	});
}

#[test]
fn example_dead_code() {
	test_input!(TestInput {
		code: r#"
import { component$ } from '@builder.io/qwik';
import { deps } from 'deps';

export const Foo = component$(({foo}) => {
    useMount$(() => {
        if (false) {
            deps();
        }
    });
    return (
        <div />
    );
})
"#
		.to_string(),
		minify: MinifyMode::Simplify,
		..TestInput::default()
	});
}

#[test]
fn example_with_tagname() {
	test_input!(TestInput {
		code: r#"
import { $, component$ } from '@builder.io/qwik';

export const Foo = component$(() => {
    return $(() => {
        return (
            <div>
            </div>
        )
    });
}, {
    tagName: "my-foo",
});
"#
		.to_string(),
		..TestInput::default()
	});
}

#[test]
fn example_with_style() {
	test_input!(TestInput {
		code: r#"
import { $, component$, useStyles$ } from '@builder.io/qwik';

export const Foo = component$(() => {
    useStyles$('.class {}');
    return (
        <div class="class"/>
    );
}, {
    tagName: "my-foo",
});
"#
		.to_string(),
		..TestInput::default()
	});
}

#[test]
fn example_props_optimization() {
	test_input!(TestInput {
		code: r#"
import { $, component$, useTask$ } from '@builder.io/qwik';
import { CONST } from 'const';
export const Works = component$(({
    count,
    some = 1+2,
    hello = CONST,
    stuff: hey,
    stuffDefault: hey2 = 123,
    ...rest}) => {
    console.log(hey, some);
    useTask$(({track}) => {
        track(() => count);
        console.log(count, rest, hey, some, hey2);
    });
    return (
        <div some={some} params={{ some }} class={count} {...rest} override>{count}</div>
    );
});

export const NoWorks2 = component$(({count, stuff: {hey}}) => {
    console.log(hey);
    useTask$(({track}) => {
        track(() => count);
        console.log(count);
    });
    return (
        <div class={count}>{count}</div>
    );
});

export const NoWorks3 = component$(({count, stuff = hola()}) => {
    console.log(stuff);
    useTask$(({track}) => {
        track(() => count);
        console.log(count);
    });
    return (
        <div class={count}>{count}</div>
    );
});
"#
		.to_string(),
		transpile_jsx: true,
		entry_strategy: EntryStrategy::Inline,
		transpile_ts: true,
		..TestInput::default()
	});
}

#[test]
fn example_use_optimization() {
	test_input!(TestInput {
		code: r#"
import { $, component$, useTask$ } from '@builder.io/qwik';
import { CONST } from 'const';
export const Works = component$((props) => {
    const {countNested} = useStore({value:{count:0}}).value;
    const countNested2 = countNested;
    const {hello} = countNested2;
    const bye = hello.bye;
    const {ciao} = bye.italian;


    return (
        <div ciao={ciao} >{foo}</div>
    );
});
"#
		.to_string(),
		transpile_jsx: false,
		entry_strategy: EntryStrategy::Inline,
		transpile_ts: true,
		is_server: Some(false),
		..TestInput::default()
	});
}

#[test]
fn example_optimization_issue_3561() {
	test_input!(TestInput {
		code: r#"
import { component$ } from '@builder.io/qwik';

export const Issue3561 = component$(() => {
    const props = useStore({
      product: {
        currentVariant: {
          variantImage: 'image',
          variantNumber: 'number',
          setContents: 'contents',
        },
      },
    });
    const {
      currentVariant: { variantImage, variantNumber, setContents } = {},
    } = props.product;

    console.log(variantImage, variantNumber, setContents)

    return <p></p>;
  });
"#
		.to_string(),
		transpile_jsx: false,
		entry_strategy: EntryStrategy::Inline,
		transpile_ts: true,
		is_server: Some(false),
		..TestInput::default()
	});
}

#[test]
fn example_optimization_issue_4386() {
	test_input!(TestInput {
		code: r#"
import { component$ } from '@builder.io/qwik';

export const FOO_MAPPING = {
    A: 1,
    B: 2,
    C: 3,
  };

  export default component$(() => {
    const key = 'A';
    const value = FOO_MAPPING[key];

    return <>{value}</>;
  });
"#
		.to_string(),
		transpile_jsx: false,
		entry_strategy: EntryStrategy::Inline,
		transpile_ts: true,
		is_server: Some(false),
		..TestInput::default()
	});
}

#[test]
fn example_optimization_issue_3542() {
	test_input!(TestInput {
        code: r#"
import { component$ } from '@builder.io/qwik';

export const AtomStatus = component$(({ctx,atom})=>{
    let status = atom.status;
    if(!atom.real) {
        status="WILL-VANISH"
    } else if (JSON.stringify(atom.atom)==JSON.stringify(atom.real)) {
        status="WTFED"
    }
    return (
        <span title={atom.ID} onClick$={(ev)=>atomStatusClick(ctx,ev,[atom])} class={["atom",status,ctx.store[atom.ID]?"selected":null]}>
        </span>
    );
})
"#
        .to_string(),
        transpile_jsx: false,
        entry_strategy: EntryStrategy::Inline,
        transpile_ts: true,
        is_server: Some(false),
        ..TestInput::default()
    });
}

#[test]
fn example_optimization_issue_3795() {
	test_input!(TestInput {
		code: r#"
import { component$ } from '@builder.io/qwik';

export const Issue3795 = component$(() => {
    let base = "foo";
    const firstAssignment = base;
    base += "bar";
    const secondAssignment = base;
    return (
      <div id='issue-3795-result'>{firstAssignment} {secondAssignment}</div>
    )
  });
"#
		.to_string(),
		entry_strategy: EntryStrategy::Inline,
		transpile_ts: true,
		transpile_jsx: true,
		is_server: Some(false),
		..TestInput::default()
	});
}

#[test]
fn example_drop_side_effects() {
	test_input!(TestInput {
		code: r#"
import { component$ } from '@builder.io/qwik';
import { server$ } from '@builder.io/qwik-city';
import { clientSupabase } from 'supabase';
import { Client } from 'openai';
import { secret } from './secret';
import { sideEffect } from './secret';

const supabase = clientSupabase();
const dfd = new Client(secret);

(function() {
    console.log('run');
  })();
  (() => {
    console.log('run');
  })();

sideEffect();

export const api = server$(() => {
    supabase.from('ffg').do(dfd);
});

export default component$(() => {
    return (
      <button onClick$={() => await api()}></button>
    )
  });
"#
		.to_string(),
		entry_strategy: EntryStrategy::Hook,
		strip_ctx_name: Some(vec!["server".into()]),
		transpile_ts: true,
		transpile_jsx: true,
		is_server: Some(false),
		..TestInput::default()
	});
}

#[test]
fn example_reg_ctx_name_hooks() {
	test_input!(TestInput {
		code: r#"
import { $, component$, server$ } from '@builder.io/qwik';
import { foo } from './foo';
export const Works = component$((props) => {
    const text = 'hola';
    return (
        <>
        <div onClick$={server$(() => console.log('in server', text))}></div>
        <div onClick$={() => foo()}></div>
        </>
    );
});
"#
		.to_string(),
		entry_strategy: EntryStrategy::Inline,
		reg_ctx_name: Some(vec!["server".into()]),
		strip_event_handlers: true,
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}

#[test]
fn example_reg_ctx_name_hooks_inlined() {
	test_input!(TestInput {
		code: r#"
import { $, component$, server$ } from '@builder.io/qwik';
export const Works = component$((props) => {
    const text = 'hola';
    return (
        <div onClick$={server$(() => console.log('in server', text))}></div>
    );
});
"#
		.to_string(),
		entry_strategy: EntryStrategy::Inline,
		reg_ctx_name: Some(vec!["server".into()]),
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}

#[test]
fn example_reg_ctx_name_hooks_hoisted() {
	test_input!(TestInput {
		code: r#"
import { $, component$, server$, useStyle$ } from '@builder.io/qwik';

export const Works = component$((props) => {
    useStyle$(STYLES);
    const text = 'hola';
    return (
        <div onClick$={server$(() => console.log('in server', text))}></div>
    );
});

const STYLES = '.class {}';
"#
		.to_string(),
		entry_strategy: EntryStrategy::Hoist,
		reg_ctx_name: Some(vec!["server".into()]),
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}
#[test]
fn example_lightweight_functional() {
	test_input!(TestInput {
		code: r#"
import { $, component$ } from '@builder.io/qwik';

export const Foo = component$(({color}) => {
    return (
        <div>
            <Button {...props} />
            <ButtonArrow {...props} />
        </div>
    );
}, {
    tagName: "my-foo",
});

export function Button({text, color}) {
    return (
        <button onColor$={color} onClick$={()=>console.log(text, color)}>{text}</button>
    );
}

export const ButtonArrow = ({text, color}) => {
    return (
        <button onColor$={color} onClick$={()=>console.log(text, color)}>{text}</button>
    );
}
"#
		.to_string(),
		..TestInput::default()
	});
}

#[test]
fn example_invalid_references() {
	test_input!(TestInput {
		code: r#"
import { $, component$ } from '@builder.io/qwik';

const I1 = 12;
const [I2, {I3, v1: [I4], I5=v2, ...I6}, I7=v3, ...I8] = obj;
function I9() {}
class I10 {}

export const App = component$(({count}) => {
    console.log(I1, I2, I3, I4, I5, I6, I7, I8, I9);
    console.log(itsok, v1, v2, v3, obj);
    return $(() => {
        return (
            <I10></I10>
        )
    });
})
"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}

#[test]
fn example_invalid_hook_expr1() {
	test_input!(TestInput {
		code: r#"
import { $, component$, useStyles$ } from '@builder.io/qwik';
import css1 from './global.css';
import css2 from './style.css';

export const App = component$(() => {
    const style = `${css1}${css2}`;
    useStyles$(style);
    const render = () => {
        return (
            <div></div>
        )
    };
    return $(render);
})
"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}

#[test]
fn example_capture_imports() {
	test_input!(TestInput {
		code: r#"
import { component$, useStyles$ } from '@builder.io/qwik';
import css1 from './global.css';
import css2 from './style.css';
import css3 from './style.css';

export const App = component$(() => {
    useStyles$(`${css1}${css2}`);
    useStyles$(css3);
})
"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}

#[test]
fn example_capturing_fn_class() {
	test_input!(TestInput {
		code: r#"
import { $, component$ } from '@builder.io/qwik';

export const App = component$(() => {
    function hola() {
      console.log('hola');
    }
    class Thing {}
    class Other {}

    return $(() => {
      hola();
      new Thing();
      return (
          <div></div>
      )
    });
})
"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}

#[test]
fn example_renamed_exports() {
	test_input!(TestInput {
		code: r#"
import { component$ as Component, $ as onRender, useStore } from '@builder.io/qwik';

export const App = Component((props) => {
    const state = useStore({thing: 0});

    return onRender(() => (
        <div>{state.thing}</div>
    ));
});
"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}

#[test]
fn example_exports() {
	test_input!(TestInput {
		filename: "project/test.tsx".to_string(),
		code: r#"
import { $, component$ } from '@builder.io/qwik';

export const [a, {b, v1: [c], d=v2, ...e}, f=v3, ...g] = obj;

const exp1 = 1;
const internal = 2;
export {exp1, internal as expr2};

export function foo() { }
export class bar {}

export default function DefaultFn() {}

export const Header = component$(() => {
    return $(() => (
        <Footer>
            <div>{a}{b}{c}{d}{e}{f}{exp1}{internal}{foo}{bar}{DefaultFn}</div>
            <div>{v1}{v2}{v3}{obj}</div>
        </Footer>
    ))
});

export const Footer = component$();
"#
		.to_string(),
		transpile_ts: true,
		..TestInput::default()
	});
}

#[test]
fn issue_117() {
	test_input!(TestInput {
		filename: "project/test.tsx".to_string(),
		code: r#"
export const cache = patternCache[cacheKey] || (patternCache[cacheKey]={});
"#
		.to_string(),
		entry_strategy: EntryStrategy::Single,
		..TestInput::default()
	});
}

#[test]
fn example_jsx() {
	test_input!(TestInput {
		code: r#"
import { $, component$, h, Fragment } from '@builder.io/qwik';

export const Lightweight = (props) => {
    return (
        <div>
            <>
                <div/>
                <button {...props}/>
            </>
        </div>
    )
};

export const Foo = component$((props) => {
    return $(() => {
        return (
            <div>
                <>
                    <div class="class"/>
                    <div class="class"></div>
                    <div class="class">12</div>
                </>
                <div class="class">
                    <Lightweight {...props}/>
                </div>
                <div class="class">
                    <div/>
                    <div/>
                    <div/>
                </div>
                <div class="class">
                    {children}
                </div>
            </div>
        )
    });
}, {
    tagName: "my-foo",
});
"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}

#[test]
fn example_jsx_listeners() {
	test_input!(TestInput {
		code: r#"
import { $, component$ } from '@builder.io/qwik';

export const Foo = component$(() => {

    return $(() => {
        const handler = $(() => console.log('reused'));
        return (
            <div
                onClick$={()=>console.log('onClick$')}
                onDocumentScroll$={()=>console.log('onDocumentScroll')}
                onDocumentScroll$={()=>console.log('onWindowScroll')}

                on-cLick$={()=>console.log('on-cLick$')}
                onDocument-sCroll$={()=>console.log('onDocument-sCroll')}
                onDocument-scroLL$={()=>console.log('onDocument-scroLL')}

                host:onClick$={()=>console.log('host:onClick$')}
                host:onDocumentScroll$={()=>console.log('host:onDocument:scroll')}
                host:onDocumentScroll$={()=>console.log('host:onWindow:scroll')}

                onKeyup$={handler}
                onDocument:keyup$={handler}
                onWindow:keyup$={handler}

                custom$={()=>console.log('custom')}
            />
        )
    });
}, {
    tagName: "my-foo",
});
"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}

#[test]
fn example_qwik_conflict() {
	test_input!(TestInput {
		code: r#"
import { $, component$, useStyles } from '@builder.io/qwik';
import { qrl } from '@builder.io/qwik/what';

export const hW = 12;
export const handleWatch = 42;

const componentQrl = () => console.log('not this', qrl());

componentQrl();
export const Foo = component$(() => {
    useStyles$('thing');
    const qwik = hW + handleWatch;
    console.log(qwik);
    const qrl = 23;
    return (
        <div onClick$={()=> console.log(qrl)}/>
    )
}, {
    tagName: "my-foo",
});

export const Root = component$(() => {
    useStyles($('thing'));
    return $(() => {
        return (
            <div/>
        )
    });
}, {
    tagName: "my-foo",
});
"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}

#[test]
fn example_fix_dynamic_import() {
	test_input!(TestInput {
		filename: "project/folder/test.tsx".to_string(),
		code: r#"
import { $, component$ } from '@builder.io/qwik';
import thing from "../state";

export function foo() {
    return import("../state")
}

export const Header = component$(() => {
    return (
        <div>
            {import("../state")}
            {thing}
        </div>
    );
});
"#
		.to_string(),
		entry_strategy: EntryStrategy::Single,
		..TestInput::default()
	});
}

#[test]
fn example_custom_inlined_functions() {
	test_input!(TestInput {
		code: r#"
import { component$, $, useStore, wrap, useEffect } from '@builder.io/qwik';

export const useMemoQrl = (qrt) => {
    useEffect(qrt);
};

export const useMemo$ = wrap(useMemoQrl);

export const App = component$((props) => {
    const state = useStore({count: 0});
    useMemo$(() => {
        console.log(state.count);
    });
    return $(() => (
        <div>{state.count}</div>
    ));
});

export const Lightweight = (props) => {
    useMemo$(() => {
        console.log(state.count);
    });
});
"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}

#[test]
fn example_missing_custom_inlined_functions() {
	test_input!(TestInput {
        code: r#"
import { component$ as Component, $ as onRender, useStore, wrap, useEffect } from '@builder.io/qwik';


export const useMemo$ = (qrt) => {
    useEffect(qrt);
};

export const App = component$((props) => {
    const state = useStore({count: 0});
    useMemo$(() => {
        console.log(state.count);
    });
    return $(() => (
        <div>{state.count}</div>
    ));
});
"#
        .to_string(),
        transpile_ts: true,
        transpile_jsx: true,
        ..TestInput::default()
    });
}

#[test]
fn example_skip_transform() {
	test_input!(TestInput {
		code: r#"
import { component$ as Component, $ as onRender } from '@builder.io/qwik';

export const handler = $(()=>console.log('hola'));

export const App = component$((props) => {
    useStyles$('hola');
    return $(() => (
        <div>{state.thing}</div>
    ));
});
"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}

#[test]
fn example_explicit_ext_transpile() {
	test_input!(TestInput {
		code: r#"
import { component$, $, useStyles$ } from '@builder.io/qwik';

export const App = component$((props) => {
    useStyles$('hola');
    return $(() => (
        <div></div>
    ));
});
"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		explicit_extensions: true,
		..TestInput::default()
	});
}

#[test]
fn example_explicit_ext_no_transpile() {
	test_input!(TestInput {
		code: r#"
import { component$, $, useStyles$ } from '@builder.io/qwik';

export const App = component$((props) => {
    useStyles$('hola');
    return $(() => (
        <div></div>
    ));
});
"#
		.to_string(),
		explicit_extensions: true,
		entry_strategy: EntryStrategy::Single,
		..TestInput::default()
	});
}

#[test]
fn example_jsx_import_source() {
	test_input!(TestInput {
		code: r#"
/* @jsxImportSource react */

import { qwikify$ } from './qwikfy';

export const App = () => (
    <div onClick$={()=>console.log('App')}></div>
);

export const App2 = qwikify$(() => (
    <div onClick$={()=>console.log('App2')}></div>
));
"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		explicit_extensions: true,
		..TestInput::default()
	});
}

#[test]
fn example_prod_node() {
	test_input!(TestInput {
		code: r#"
import { component$ } from '@builder.io/qwik';

export const Foo = component$(() => {
    return (
        <div>
            <div onClick$={() => console.log('first')}/>
            <div onClick$={() => console.log('second')}/>
            <div onClick$={() => console.log('third')}/>
        </div>
    );
});
"#
		.to_string(),
		mode: EmitMode::Prod,
		..TestInput::default()
	});
}

#[test]
fn example_use_client_effect() {
	test_input!(TestInput {
		code: r#"
import { component$, useBrowserVisibleTask$, useStore, useStyles$ } from '@builder.io/qwik';

export const Child = component$(() => {
    const state = useStore({
        count: 0
    });

    // Double count watch
    useBrowserVisibleTask$(() => {
        const timer = setInterval(() => {
        state.count++;
        }, 1000);
        return () => {
        clearInterval(timer);
        }
    });

    return (
        <div>
        {state.count}
    </div>
    );
});

"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}

#[test]
fn example_inlined_entry_strategy() {
	test_input!(TestInput {
		code: r#"
import { component$, useBrowserVisibleTask$, useStore, useStyles$ } from '@builder.io/qwik';
import { thing } from './sibling';
import mongodb from 'mongodb';

export const Child = component$(() => {

    useStyles$('somestring');
    const state = useStore({
        count: 0
    });

    // Double count watch
    useBrowserVisibleTask$(() => {
        state.count = thing.doStuff() + import("./sibling");
    });

    return (
        <div onClick$={() => console.log(mongodb)}>
        </div>
    );
});

"#
		.to_string(),
		entry_strategy: EntryStrategy::Inline,
		..TestInput::default()
	});
}

#[test]
fn example_default_export() {
	test_input!(TestInput {
		code: r#"
import { component$ } from '@builder.io/qwik';
import { sibling } from './sibling';

export default component$(() => {
    return (
        <div onClick$={() => console.log(mongodb, sibling)}>
        </div>
    );
});

"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		filename: "src/routes/_repl/[id]/[[...slug]].tsx".into(),
		entry_strategy: EntryStrategy::Smart,
		explicit_extensions: true,
		..TestInput::default()
	});
}

#[test]
fn example_default_export_index() {
	test_input!(TestInput {
		code: r#"
import { component$ } from '@builder.io/qwik';

export default component$(() => {
    return (
        <div onClick$={() => console.log(mongodb)}>
        </div>
    );
});

"#
		.to_string(),
		filename: "src/components/mongo/index.tsx".into(),
		entry_strategy: EntryStrategy::Inline,
		..TestInput::default()
	});
}

#[test]
fn example_default_export_invalid_ident() {
	test_input!(TestInput {
		code: r#"
import { component$ } from '@builder.io/qwik';

export default component$(() => {
    return (
        <div onClick$={() => console.log(mongodb)}>
        </div>
    );
});

"#
		.to_string(),
		filename: "src/components/mongo/404.tsx".into(),
		..TestInput::default()
	});
}

#[test]
fn example_parsed_inlined_qrls() {
	test_input!(TestInput {
		code: r#"
import { componentQrl, inlinedQrl, useStore, jsxs, jsx, useLexicalScope } from '@builder.io/qwik';

export const App = /*#__PURE__*/ componentQrl(inlinedQrl(()=>{
    useStyles$(inlinedQrl(STYLES, "STYLES_odz7dfdfdM"));
    useStyles$(inlinedQrl(STYLES, "STYLES_odzdfdfdM"));

    const store = useStore({
        count: 0
    });
    return /*#__PURE__*/ jsxs("div", {
        children: [
            /*#__PURE__*/ jsxs("p", {
                children: [
                    "Count: ",
                    store.count
                ]
            }),
            /*#__PURE__*/ jsx("p", {
                children: /*#__PURE__*/ jsx("button", {
                    onClick$: inlinedQrl(()=>{
                        const [store] = useLexicalScope();
                        return store.count++;
                    }, "App_component_div_p_button_onClick_odz7eidI4GM", [
                        store
                    ]),
                    children: "Click"
                })
            })
        ]
    });
}, "App_component_Fh88JClhbC0"));

export const STYLES = ".red { color: red; }";

"#
		.to_string(),
		entry_strategy: EntryStrategy::Inline,
		mode: EmitMode::Prod,
		transpile_ts: false,
		..TestInput::default()
	});
}

#[test]
fn example_use_server_mount() {
	test_input!(TestInput {
		code: r#"
import { component$, useServerMount$, useStore, useStyles$ } from '@builder.io/qwik';
import mongo from 'mongodb';
import redis from 'redis';

export const Parent = component$(() => {
    const state = useStore({
        text: ''
    });

    // Double count watch
    useServerMount$(async () => {
        state.text = await mongo.users();
        redis.set(state.text);
    });

    return (
        <div onClick$={() => console.log('parent')}>
            {state.text}
        </div>
    );
});

export const Child = component$(() => {
    const state = useStore({
        text: ''
    });

    // Double count watch
    useServerMount$(async () => {
        state.text = await mongo.users();
    });

    return (
        <div onClick$={() => console.log('child')}>
            {state.text}
        </div>
    );
});
"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		entry_strategy: EntryStrategy::Smart,
		..TestInput::default()
	});
}

#[test]
fn example_manual_chunks() {
	test_input!(TestInput {
		code: r#"
import { component$, useTask$, useStore, useStyles$ } from '@builder.io/qwik';
import mongo from 'mongodb';
import redis from 'redis';

export const Parent = component$(() => {
    const state = useStore({
        text: ''
    });

    // Double count watch
    useTask$(async () => {
        state.text = await mongo.users();
        redis.set(state.text);
    });

    return (
        <div onClick$={() => console.log('parent')}>
            {state.text}
        </div>
    );
});

export const Child = component$(() => {
    const state = useStore({
        text: ''
    });

    // Double count watch
    useTask$(async () => {
        state.text = await mongo.users();
    });

    return (
        <div onClick$={() => console.log('child')}>
            {state.text}
        </div>
    );
});
"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		manual_chunks: Some(HashMap::from_iter(vec![
			("C5XE49Nqd3A".into(), "chunk_clicks".into()),
			("elliVSnAiOQ".into(), "chunk_clicks".into()),
		])),
		entry_strategy: EntryStrategy::Smart,
		..TestInput::default()
	});
}

#[test]
fn example_strip_exports_unused() {
	test_input!(TestInput {
		code: r#"
import { component$ } from '@builder.io/qwik';
import mongodb from 'mongodb';

export const onGet = () => {
    const data = mongodb.collection.whatever;
    return {
        body: {
        data
        }
    }
};

export default component$(()=> {
    return <div>cmp</div>
});
"#
		.to_string(),
		strip_exports: Some(vec!["onGet".into()]),
		..TestInput::default()
	});
}

#[test]
fn example_strip_exports_used() {
	test_input!(TestInput {
		code: r#"
import { component$, useResource$ } from '@builder.io/qwik';
import mongodb from 'mongodb';

export const onGet = () => {
    const data = mongodb.collection.whatever;
    return {
        body: {
        data
        }
    }
};

export default component$(()=> {
    useResource$(() => {
        return onGet();
    })
    return <div>cmp</div>
});
"#
		.to_string(),
		strip_exports: Some(vec!["onGet".into()]),
		..TestInput::default()
	});
}

#[test]
fn example_strip_server_code() {
	test_input!(TestInput {
        code: r#"
import { component$, useServerMount$, serverLoader$, serverStuff$, $, client$, useStore, useTask$ } from '@builder.io/qwik';
import mongo from 'mongodb';
import redis from 'redis';
import { handler } from 'serverless';

export const Parent = component$(() => {
    const state = useStore({
        text: ''
    });

    // Double count watch
    useServerMount$(async () => {
        state.text = await mongo.users();
        redis.set(state.text);
    });

    serverStuff$(async () => {
        // should be removed too
        const a = $(() => {
            // from $(), should not be removed
        });
        const b = client$(() => {
            // from clien$(), should not be removed
        });
        return [a,b];
    })

    serverLoader$(handler);

    useTask$(() => {
        // Code
    });

    return (
        <div onClick$={() => console.log('parent')}>
            {state.text}
        </div>
    );
});
"#
        .to_string(),
        transpile_ts: true,
        transpile_jsx: true,
        entry_strategy: EntryStrategy::Hook,
        strip_ctx_name: Some(vec!["useServerMount$".into(), "server".into()]),
        ..TestInput::default()
    });
}

#[test]
fn example_server_auth() {
	test_input!(TestInput {
		code: r#"
import GitHub from '@auth/core/providers/github'
import Facebook from 'next-auth/providers/facebook'
import Google from 'next-auth/providers/google'
import {serverAuth$, auth$} from '@auth/qwik';

export const { onRequest, logout, getSession, signup } = serverAuth$({
    providers: [
    GitHub({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET
    }),
    Facebook({
        clientId: import.meta.env.FACEBOOK_ID,
        clientSecret: import.meta.env.FACEBOOK_SECRET
    }),
    Google({
        clientId: process.env.GOOGLE_ID,
        clientSecret: process.env.GOOGLE_SECRET
    })
    ]
});

export const { onRequest, logout, getSession, signup } = auth$({
    providers: [
    GitHub({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET
    }),
    Facebook({
        clientId: process.env.FACEBOOK_ID,
        clientSecret: process.env.FACEBOOK_SECRET
    }),
    Google({
        clientId: process.env.GOOGLE_ID,
        clientSecret: process.env.GOOGLE_SECRET
    })
    ]
});
"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		entry_strategy: EntryStrategy::Hook,
		..TestInput::default()
	});
}

#[test]
fn example_strip_client_code() {
	test_input!(TestInput {
		code: r#"
import { component$, useClientMount$, useStore, useTask$ } from '@builder.io/qwik';
import mongo from 'mongodb';
import redis from 'redis';
import threejs from 'threejs';
import { a } from './keep';
import { b } from '../keep2';
import { c } from '../../remove';

export const Parent = component$(() => {
    const state = useStore({
        text: ''
    });

    // Double count watch
    useClientMount$(async () => {
        state.text = await mongo.users();
        redis.set(state.text, a, b, c);
    });

    useTask$(() => {
        // Code
    });

    return (
        <div
            shouldRemove$={() => state.text}
            onClick$={() => console.log('parent', state, threejs)}
        >
            <Div
                onClick$={() => console.log('keep')}
                render$={() => state.text}
            />
            {state.text}
        </div>
    );
});
"#
		.to_string(),
		filename: "components/component.tsx".into(),
		transpile_ts: true,
		transpile_jsx: true,
		entry_strategy: EntryStrategy::Inline,
		strip_ctx_name: Some(vec!["useClientMount$".into(),]),
		strip_event_handlers: true,
		..TestInput::default()
	});
}

#[test]
fn issue_150() {
	test_input!(TestInput {
		code: r#"
import { component$, $ } from '@builder.io/qwik';
import { hola } from 'sdfds';

export const Greeter = component$(() => {
    const stuff = useStore();
    return $(() => {
        return (
            <div
                class={{
                    'foo': true,
                    'bar': stuff.condition,
                    'baz': hola ? 'true' : 'false',
                }}
            />
        )
    });
});

const d = $(()=>console.log('thing'));
"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}

#[test]
fn example_input_bind() {
	test_input!(TestInput {
		code: r#"
import { component$, $ } from '@builder.io/qwik';

export const Greeter = component$(() => {
    const value = useSignal(0);
    const checked = useSignal(false);
    const stuff = useSignal();
    return (
        <>
            <input bind:value={value} />
            <input bind:checked={checked} />
            <input bind:stuff={stuff} />
            <div>{value}</div>
            <div>{value.value}</div>
        </>

    )
});
"#
		.to_string(),
		entry_strategy: EntryStrategy::Inline,
		transpile_ts: true,
		transpile_jsx: true,
		mode: EmitMode::Prod,
		..TestInput::default()
	});
}

#[test]
fn example_import_assertion() {
	test_input!(TestInput {
		code: r#"
import { component$, $ } from '@builder.io/qwik';
import json from "./foo.json" assert { type: "json" };

export const Greeter = component$(() => {
    return json;
});
"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}

#[cfg(target_os = "windows")]
#[test]
fn issue_188() {
	let res = test_input!({
		filename: r"components\apps\apps.tsx".to_string(),
		src_dir: r"C:\users\apps".to_string(),
		code: r#"
import { component$, $ } from '@builder.io/qwik';

export const Greeter = component$(() => {
    return $(() => {
        return (
            <div/>
        )
    });
});

const d = $(()=>console.log('thing'));
"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		snapshot: false,
	})
	.unwrap();
	let last_module = res.modules.last().unwrap();
	assert_eq!(last_module.path, r"C:/users/apps/components/apps/apps.tsx")
}
#[test]
fn issue_476() {
	test_input!(TestInput {
		code: r#"
import { Counter } from "./counter.tsx";

export const Root = () => {
    return (
        <html>
            <head>
                <meta charSet="utf-8" />
                <title>Qwik Blank App</title>
            </head>
            <body>
                <Counter initial={3} />
            </body>
        </html>
    );
};
"#
		.to_string(),
		transpile_ts: false,
		transpile_jsx: false,
		..TestInput::default()
	});
}

#[test]
fn issue_964() {
	test_input!(TestInput {
		code: r#"
import { component$ } from '@builder.io/qwik';

export const App = component$(() => {
    console.log(function*(lo: any, t: any) {
    console.log(yield (yield lo)(t.href).then((r) => r.json()));
    });

    return <p>Hello Qwik</p>;
});
"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}

#[test]
fn example_immutable_analysis() {
	test_input!(TestInput {
		code: r#"
import { component$, useStore, $ } from '@builder.io/qwik';
import importedValue from 'v';
import styles from './styles.module.css';

export const App = component$((props) => {
    const {Model} = props;
    const state = useStore({count: 0});
    const remove = $((id: number) => {
        const d = state.data;
        d.splice(
          d.findIndex((d) => d.id === id),
          1
        )
      });
    return (
        <>
            <p class="stuff" onClick$={props.onClick$}>Hello Qwik</p>
            <Div
                class={styles.foo}
                document={window.document}
                onClick$={props.onClick$}
                onEvent$={() => console.log('stuff')}
                transparent$={() => {console.log('stuff')}}
                immutable1="stuff"
                immutable2={{
                    foo: 'bar',
                    baz: importedValue ? true : false,
                }}
                immutable3={2}
                immutable4$={(ev) => console.log(state.count)}
                immutable5={[1, 2, importedValue, null, {}]}
            >
                <p>Hello Qwik</p>
            </Div>
            [].map(() => (
                <Model
                    class={state}
                    remove$={remove}
                    mutable1={{
                        foo: 'bar',
                        baz: state.count ? true : false,
                    }}
                    mutable2={(() => console.log(state.count))()}
                    mutable3={[1, 2, state, null, {}]}
                />
            ));
        </>
    );
});
"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}

#[test]
fn example_ts_enums_issue_1341() {
	test_input!(TestInput {
		code: r#"
import { component$, useStore } from '@builder.io/qwik';

enum Thing {
    A,
    B
}

export const App = component$(() => {
    console.log(Thing.A);
    return (
        <>
            <p class="stuff">Hello Qwik</p>
        </>
    );
});
"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}

#[test]
fn example_ts_enums_no_transpile() {
	test_input!(TestInput {
		code: r#"
import { component$, useStore } from '@builder.io/qwik';

export enum Thing {
    A,
    B
}

export const App = component$(() => {
    console.log(Thing.A);
    return (
        <>
            <p class="stuff">Hello Qwik</p>
        </>
    );
});
"#
		.to_string(),
		transpile_ts: false,
		transpile_jsx: false,

		..TestInput::default()
	});
}

#[test]
fn example_ts_enums() {
	test_input!(TestInput {
		code: r#"
import { component$, useStore } from '@builder.io/qwik';

export enum Thing {
    A,
    B
}

export const App = component$(() => {
    console.log(Thing.A);
    return (
        <>
            <p class="stuff">Hello Qwik</p>
        </>
    );
});
"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}

#[test]
fn example_dev_mode() {
	test_input!(TestInput {
		code: r#"
import { component$, useStore } from '@builder.io/qwik';

export const App = component$(() => {
    return (
        <Cmp>
            <p class="stuff" onClick$={() => console.log('warn')}>Hello Qwik</p>
        </Cmp>
    );
});
"#
		.to_string(),
		mode: EmitMode::Dev,
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}

#[test]
fn example_dev_mode_inlined() {
	test_input!(TestInput {
		code: r#"
import { component$, useStore } from '@builder.io/qwik';

export const App = component$(() => {
    return (
        <Cmp>
            <p class="stuff" onClick$={() => console.log('warn')}>Hello Qwik</p>
        </Cmp>
    );
});
"#
		.to_string(),
		mode: EmitMode::Dev,
		entry_strategy: EntryStrategy::Inline,
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}

#[test]
fn example_transpile_jsx_only() {
	test_input!(TestInput {
		code: r#"
import { component$, useStore } from '@builder.io/qwik';

export const App = component$((props: Stuff) => {
    return (
        <Cmp>
            <p class="stuff" onClick$={() => console.log('warn')}>Hello Qwik</p>
        </Cmp>
    );
});
"#
		.to_string(),
		transpile_ts: false,
		transpile_jsx: true,
		explicit_extensions: true,
		..TestInput::default()
	});
}

#[test]
fn example_spread_jsx() {
	test_input!(TestInput {
		code: r#"
import { component$ } from '@builder.io/qwik';
import { useDocumentHead, useLocation } from '@builder.io/qwik-city';

/**
 * The RouterHead component is placed inside of the document `<head>` element.
 */
export const RouterHead = component$(() => {
  const head = useDocumentHead();
  const loc = useLocation();

  return (
    <>
      <title>{head.title}</title>

      <link rel="canonical" href={loc.href} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

      {head.meta.map((m) => (
        <meta {...m} />
      ))}

      {head.links.map((l) => (
        <link {...l} key={l.key} />
      ))}

      {head.styles.map((s) => (
        <style {...s.props} dangerouslySetInnerHTML={s.style} key={s.key} />
      ))}
    </>
  );
});"#
			.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}

#[test]
fn example_export_issue() {
	test_input!(TestInput {
		code: r#"
import { component$ } from '@builder.io/qwik';

const App = component$(() => {
    return (
        <div>hola</div>
    );
});


export const Root = component$((props: Stuff) => {
    return (
        <App/>
    );
});

const Other = 12;
export { Other as App };

export default App;
"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}

#[test]
fn example_jsx_keyed() {
	test_input!(TestInput {
		code: r#"
import { component$, useStore } from '@builder.io/qwik';

export const App = component$((props: Stuff) => {
    return (
        <>
            <Cmp key="stuff"></Cmp>
            <Cmp></Cmp>
            <Cmp prop="23"></Cmp>
            <Cmp prop="23" key={props.stuff}></Cmp>
            <p key={props.stuff}>Hello Qwik</p>
        </>
    );
});
"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		explicit_extensions: true,
		..TestInput::default()
	});
}

#[test]
fn example_jsx_keyed_dev() {
	test_input!(TestInput {
		code: r#"
import { component$, useStore } from '@builder.io/qwik';

export const App = component$((props: Stuff) => {
    return (
        <>
            <Cmp key="stuff"></Cmp>
            <Cmp></Cmp>
            <Cmp prop="23"></Cmp>
            <Cmp prop="23" key={props.stuff}></Cmp>
            <p key={props.stuff}>Hello Qwik</p>
        </>
    );
});
"#
		.to_string(),
		filename: "project/index.tsx".into(),
		src_dir: "/src/project".into(),
		transpile_ts: true,
		transpile_jsx: true,
		mode: EmitMode::Dev,
		explicit_extensions: true,
		..TestInput::default()
	});
}

#[test]
fn example_mutable_children() {
	test_input!(TestInput {
		code: r#"
import { component$, useStore, Slot, Fragment } from '@builder.io/qwik';
import Image from './image.jpg?jsx';

export function Fn1(props: Stuff) {
    return (
        <>
            <div>{prop < 2 ? <p>1</p> : <Stuff>2</Stuff>}</div>
        </>
    );
}

export function Fn2(props: Stuff) {
    return (
        <div>{prop.value && <Stuff></Stuff>}<div></div></div>
    );
}

export function Fn3(props: Stuff) {
    if (prop.value) {
        return (
            <Stuff></Stuff>
        );
    }
    return (
        <div></div>
    );
}

export function Fn4(props: Stuff) {
    if (prop.value) {
        return (
            <div></div>
        );
    }
    return (
        <Stuff></Stuff>
    );
}

export const Arrow = (props: Stuff) => <div>{prop < 2 ? <p>1</p> : <Stuff>2</Stuff>}</div>;

export const AppDynamic1 = component$((props: Stuff) => {
    return (
        <>
            <div>{prop < 2 ? <p>1</p> : <Stuff>2</Stuff>}</div>
        </>
    );
});
export const AppDynamic2 = component$((props: Stuff) => {
    return (
        <div>{prop.value && <Stuff></Stuff>}<div></div></div>
    );
});

export const AppDynamic3 = component$((props: Stuff) => {
    if (prop.value) {
        return (
            <Stuff></Stuff>
        );
    }
    return (
        <div></div>
    );
});

export const AppDynamic4 = component$((props: Stuff) => {
    if (prop.value) {
        return (
            <div></div>
        );
    }
    return (
        <Stuff></Stuff>
    );
});

export const AppStatic = component$((props: Stuff) => {
    return (
        <>
            <div>Static {f ? 1 : 3}</div>
            <div>{prop < 2 ? <p>1</p> : <p>2</p>}</div>

            <div>{prop.value && <div></div>}</div>
            <div>{prop.value && <Fragment><Slot></Slot></Fragment>}</div>
            <div>{prop.value && <><div></div></>}</div>
            <div>{prop.value && <Image/>}</div>
            <div>Static {f ? 1 : 3}</div>
            <div>Static</div>
            <div>Static {props.value}</div>
            <div>Static {stuff()}</div>
            <div>Static {stuff()}</div>
        </>
    );
});
"#
		.to_string(),
		entry_strategy: EntryStrategy::Hoist,
		transpile_ts: true,
		transpile_jsx: true,
		explicit_extensions: true,
		..TestInput::default()
	});
}

#[test]
fn example_immutable_function_components() {
	test_input!(TestInput {
		code: r#"
import { component$, useStore, Slot } from '@builder.io/qwik';

export const App = component$((props: Stuff) => {
    return (
        <div>
            <Slot/>
        </div>
    );
});
"#
		.to_string(),
		entry_strategy: EntryStrategy::Hoist,
		transpile_ts: true,
		transpile_jsx: true,
		explicit_extensions: true,
		..TestInput::default()
	});
}
#[test]
fn example_transpile_ts_only() {
	test_input!(TestInput {
		code: r#"
import { component$, useStore } from '@builder.io/qwik';

export const App = component$((props: Stuff) => {
    return (
        <Cmp>
            <p class="stuff" onClick$={() => console.log('warn')}>Hello Qwik</p>
        </Cmp>
    );
});
"#
		.to_string(),
		entry_strategy: EntryStrategy::Inline,
		transpile_ts: true,
		transpile_jsx: false,
		explicit_extensions: true,
		..TestInput::default()
	});
}

#[test]
fn example_class_name() {
	test_input!(TestInput {
		code: r#"
import { component$ } from '@builder.io/qwik';

export const App2 = component$(() => {
    const signal = useSignal();
    const computed = signal.value + 'foo';
    return (
        <>
            <div className="hola"></div>
            <div className={signal.value}></div>
            <div className={signal}></div>
            <div className={computed}></div>

            <Foo className="hola"></Foo>
            <Foo className={signal.value}></Foo>
            <Foo className={signal}></Foo>
            <Foo className={computed}></Foo>
        </>
    );
});
"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		explicit_extensions: true,
		..TestInput::default()
	});
}

#[test]
fn example_preserve_filenames() {
	test_input!(TestInput {
		code: r#"
import { component$, useStore } from '@builder.io/qwik';

export const App = component$((props: Stuff) => {
    return (
        <Cmp>
            <p class="stuff" onClick$={() => console.log('warn')}>Hello Qwik</p>
        </Cmp>
    );
});
"#
		.to_string(),
		entry_strategy: EntryStrategy::Inline,
		transpile_ts: false,
		transpile_jsx: true,
		preserve_filenames: true,
		explicit_extensions: true,
		..TestInput::default()
	});
}

#[test]
fn example_preserve_filenames_hooks() {
	test_input!(TestInput {
		code: r#"
import { component$, useStore } from '@builder.io/qwik';

export const App = component$((props: Stuff) => {
    foo();
    return (
        <Cmp>
            <p class="stuff" onClick$={() => console.log('warn')}>Hello Qwik</p>
        </Cmp>
    );
});

export const foo = () => console.log('foo');
"#
		.to_string(),
		entry_strategy: EntryStrategy::Hook,
		transpile_ts: true,
		transpile_jsx: true,
		preserve_filenames: true,
		explicit_extensions: true,
		..TestInput::default()
	});
}

#[test]
fn example_build_server() {
	test_input!(TestInput {
		code: r#"
import { component$, useStore } from '@builder.io/qwik';
import { isServer, isBrowser } from '@builder.io/qwik/build';
import { mongodb } from 'mondodb';
import { threejs } from 'threejs';

import L from 'leaflet';

export const functionThatNeedsWindow = () => {
  if (isBrowser) {
    console.log('l', L);
    console.log('hey');
    window.alert('hey');
  }
};

export const App = component$(() => {
    useMount$(() => {
        if (isServer) {
            console.log('server', mongodb());
        }
        if (isBrowser) {
            console.log('browser', new threejs());
        }
    });
    return (
        <Cmp>
            {isServer && <p>server</p>}
            {isBrowser && <p>server</p>}
        </Cmp>
    );
});
"#
		.to_string(),
		is_server: Some(true),
		mode: EmitMode::Prod,
		..TestInput::default()
	});
}

#[test]
fn example_derived_signals_div() {
	test_input!(TestInput {
		code: r#"
import { component$, useStore, mutable } from '@builder.io/qwik';

import {dep} from './file';
import styles from './styles.module.css';

export const App = component$((props) => {
    const signal = useSignal(0);
    const store = useStore({});
    const count = props.counter.count;

    return (
        <div
            class={{
                even: count % 2 === 0,
                odd: count % 2 === 1,
                stable0: true,
                hidden: false,
            }}
            staticClass={styles.foo}
            staticDocument={window.document}
            staticText="text"
            staticText2={`text`}
            staticNumber={1}
            staticBoolean={true}
            staticExpr={`text${12}`}
            staticExpr2={typeof `text${12}` === 'string' ? 12 : 43}

            signal={signal}
            signalValue={signal.value}
            signalComputedValue={12 + signal.value}

            store={store.address.city.name}
            storeComputed={store.address.city.name ? 'true' : 'false'}

            dep={dep}
            depAccess={dep.thing}
            depComputed={dep.thing + 'stuff'}

            global={globalThing}
            globalAccess={globalThing.thing}
            globalComputed={globalThing.thing + 'stuff'}


            noInline={signal.value()}
            noInline2={signal.value + unknown()}
            noInline3={mutable(signal)}
            noInline4={signal.value + dep}
        />

    );
});
"#
		.to_string(),
		transpile_jsx: true,
		transpile_ts: true,
		entry_strategy: EntryStrategy::Hoist,
		..TestInput::default()
	});
}

#[test]
fn example_issue_4438() {
	test_input!(TestInput {
		code: r#"
import { component$, useSignal } from '@builder.io/qwik';

export const App = component$(() => {
    const toggle = useSignal(false);
    return (
        <>
            <div data-nu={toggle.value ? $localize`singular` : 'plural'}></div>
            <div>{toggle.value ? $localize`singular` : $localize`plural`}</div>
        </>
    );
});
"#
		.to_string(),
		transpile_jsx: true,
		transpile_ts: true,
		entry_strategy: EntryStrategy::Hoist,
		..TestInput::default()
	});
}

#[test]
fn example_derived_signals_children() {
	test_input!(TestInput {
		code: r#"
import { component$, useStore, mutable } from '@builder.io/qwik';

import {dep} from './file';

export const TextContent = component$((props) => {
    return (
        <>
            <div>data-nu: {props['data-nu']}</div>
            <div>class: {props.class}</div>
        </>
    );
});

export const App = component$(() => {
    const signal = useSignal(0);
    const store = useStore({});
    return (
        <>
            <div>text</div>
            <div>{`text`}</div>
            <div>{1}</div>
            <div>{true}</div>
            <div>{`text${12}`}</div>
            <div>{typeof `text${12}` === 'string' ? 12 : 43}</div>
            <div>{signal}</div>
            <div>{signal.value}</div>
            <div>{12 + signal.value}</div>
            <div>{store.address.city.name}</div>
            <div>{store.address.city.name ? 'true' : 'false'}</div>
            <div>{dep}</div>
            <div>{dep.thing}</div>
            <div>{dep.thing + 'stuff'}</div>
            <div>{globalThing}</div>
            <div>{globalThing.thing}</div>
            <div>{globalThing.thing + 'stuff'}</div>
            <div>{signal.value()}</div>
            <div>{signal.value + unknown()}</div>
            <div>{mutable(signal)}</div>
            <div>{signal.value + dep}</div>
        </>
    );
});
"#
		.to_string(),
		transpile_jsx: true,
		transpile_ts: true,
		entry_strategy: EntryStrategy::Hoist,
		..TestInput::default()
	});
}

#[test]
fn example_derived_signals_multiple_children() {
	test_input!(TestInput {
		code: r#"
import { component$, useStore, mutable } from '@builder.io/qwik';

import {dep} from './file';

export const App = component$(() => {
    const signal = useSignal(0);
    const store = useStore({});
    return (
        <>
            <div>First text</div>
            <div>First {`text`}</div>
            <div>First {1}</div>
            <div>First {true}</div>
            <div>First {`text${12}`}</div>
            <div>First {typeof `text${12}` === 'string' ? 12 : 43}</div>
            <div>First {signal}</div>
            <div>First {signal.value}</div>
            <div>First {12 + signal.value}</div>
            <div>First {store.address.city.name}</div>
            <div>First {store.address.city.name ? 'true' : 'false'}</div>
            <div>First {dep}</div>
            <div>First {dep.thing}</div>
            <div>First {dep.thing + 'stuff'}</div>
            <div>First {globalThing}</div>
            <div>First {globalThing.thing}</div>
            <div>First {globalThing.thing + 'stuff'}</div>
            <div>First {signal.value()}</div>
            <div>First {signal.value + unknown()}</div>
            <div>First {mutable(signal)}</div>
            <div>First {signal.value + dep}</div>
        </>
    );
});
"#
		.to_string(),
		transpile_jsx: true,
		transpile_ts: true,
		entry_strategy: EntryStrategy::Hoist,
		..TestInput::default()
	});
}

#[test]
fn example_derived_signals_complext_children() {
	test_input!(TestInput {
		code: r#"
import { component$, useStore, mutable } from '@builder.io/qwik';

import {dep} from './file';

export const App = component$(() => {
    const signal = useSignal(0);
    const store = useStore({});
    return (
        <>
            <ul id="issue-2800-result">
                {Object.entries(store).map(([key, value]) => (
                <li>
                    {key} - {value}
                </li>
                ))}
            </ul>
        </>
    );
});
"#
		.to_string(),
		transpile_jsx: true,
		transpile_ts: true,
		entry_strategy: EntryStrategy::Hoist,
		..TestInput::default()
	});
}

#[test]
fn example_derived_signals_cmp() {
	test_input!(TestInput {
		code: r#"
import { component$, useStore, mutable } from '@builder.io/qwik';

import {dep} from './file';
import {Cmp} from './cmp';

export const App = component$(() => {
    const signal = useSignal(0);
    const store = useStore({});
    return (
        <Cmp
            staticText="text"
            staticText2={`text`}
            staticNumber={1}
            staticBoolean={true}
            staticExpr={`text${12}`}
            staticExpr2={typeof `text${12}` === 'string' ? 12 : 43}

            signal={signal}
            signalValue={signal.value}
            signalComputedValue={12 + signal.value}

            store={store.address.city.name}
            storeComputed={store.address.city.name ? 'true' : 'false'}

            dep={dep}
            depAccess={dep.thing}
            depComputed={dep.thing + 'stuff'}

            global={globalThing}
            globalAccess={globalThing.thing}
            globalComputed={globalThing.thing + 'stuff'}


            noInline={signal.value()}
            noInline2={signal.value + unknown()}
            noInline3={mutable(signal)}
            noInline4={signal.value + dep}
        />
    );
});
"#
		.to_string(),
		transpile_jsx: true,
		transpile_ts: true,
		entry_strategy: EntryStrategy::Hoist,
		..TestInput::default()
	});
}

#[test]
fn example_issue_33443() {
	test_input!(TestInput {
        code: r#"
import { component$, useSignal } from '@builder.io/qwik';

export const Issue3742 = component$(({description = '', other}: any) => {
    const counter = useSignal(0);
    return (
      <div
        title={(description && 'description' in other) ? `Hello ${counter.value}` : `Bye ${counter.value}`}
      >
        Issue3742
        <button onClick$={() => counter.value++}>
          Increment
        </button>
      </div>
    )
  });
  "#
        .to_string(),
        transpile_jsx: true,
        transpile_ts: true,
        entry_strategy: EntryStrategy::Hoist,
        ..TestInput::default()
    });
}
#[test]
fn example_getter_generation() {
	test_input!(TestInput {
		code: r#"
import { component$, useStore } from '@builder.io/qwik';

export const App = component$(() => {
    const store = useStore({
        count: 0,
        stuff: 0,
        nested: {
            count: 0
        }
    });
    const signal = useSignal(0);
    return (
        <Cmp
            prop={'true' + 1 ? 'true' : ''}
            count={store.count}
            nested={store.nested.count}
            signal={signal}
            store={store.stuff + 12}
            value={signal.formData?.get('username')}
        >
        </Cmp>
    );
});

export const Cmp = component$((props) => {
    return (
        <>
            <p data-value={props.count}>{props.nested.count}</p>
            <p>Value {props.count}<span></span></p>
        </>
    );
});
"#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}

#[test]
fn example_qwik_react() {
	test_input!(TestInput {
        code: r#"
import { componentQrl, inlinedQrl, useLexicalScope, useHostElement, useStore, useTaskQrl, noSerialize, SkipRerender, implicit$FirstArg } from '@builder.io/qwik';
import { jsx, Fragment } from '@builder.io/qwik/jsx-runtime';
import { isBrowser, isServer } from '@builder.io/qwik/build';

function qwikifyQrl(reactCmpQrl) {
    return /*#__PURE__*/ componentQrl(inlinedQrl((props)=>{
        const [reactCmpQrl] = useLexicalScope();
        const hostElement = useHostElement();
        const store = useStore({});
        let run;
        if (props['client:visible']) run = 'visible';
        else if (props['client:load'] || props['client:only']) run = 'load';
        useTaskQrl(inlinedQrl(async (track)=>{
            const [hostElement, props, reactCmpQrl, store] = useLexicalScope();
            track(props);
            if (isBrowser) {
                if (store.data) store.data.root.render(store.data.client.Main(store.data.cmp, filterProps(props)));
                else {
                    const [Cmp, client] = await Promise.all([
                        reactCmpQrl.resolve(),
                        import('./client-f762f78c.js')
                    ]);
                    let root;
                    if (hostElement.childElementCount > 0) root = client.hydrateRoot(hostElement, client.Main(Cmp, filterProps(props), store.event));
                    else {
                        root = client.createRoot(hostElement);
                        root.render(client.Main(Cmp, filterProps(props)));
                    }
                    store.data = noSerialize({
                        client,
                        cmp: Cmp,
                        root
                    });
                }
            }
        }, "qwikifyQrl_component_useWatch_x04JC5xeP1U", [
            hostElement,
            props,
            reactCmpQrl,
            store
        ]), {
            run
        });
        if (isServer && !props['client:only']) {
            const jsx$1 = Promise.all([
                reactCmpQrl.resolve(),
                import('./server-9ac6caad.js')
            ]).then(([Cmp, server])=>{
                const html = server.render(Cmp, filterProps(props));
                return /*#__PURE__*/ jsx(Host, {
                    dangerouslySetInnerHTML: html,
                    [_IMMUTABLE]: [
                        "dangerouslySetInnerHTML"
                    ]
                });
            });
            return /*#__PURE__*/ jsx(Fragment, {
                children: jsx$1
            });
        }
        return /*#__PURE__*/ jsx(Host, {
            children: /*#__PURE__*/ jsx(SkipRerender, {})
        });
    }, "qwikifyQrl_component_zH94hIe0Ick", [
        reactCmpQrl
    ]), {
        tagName: 'qwik-wrap'
    });
}
const filterProps = (props)=>{
    const obj = {};
    Object.keys(props).forEach((key)=>{
        if (!key.startsWith('client:')) obj[key] = props[key];
    });
    return obj;
};
const qwikify$ = implicit$FirstArg(qwikifyQrl);

async function renderToString(rootNode, opts) {
    const mod = await import('./server-9ac6caad.js');
    const result = await mod.renderToString(rootNode, opts);
    const styles = mod.getGlobalStyleTag(result.html);
    const finalHtml = styles + result.html;
    return {
        ...result,
        html: finalHtml
    };
}

export { qwikify$, qwikifyQrl, renderToString };
        "#
        .to_string(),
        filename: "../node_modules/@builder.io/qwik-react/index.qwik.mjs".to_string(),
        entry_strategy: EntryStrategy::Hook,
        explicit_extensions: true,
        ..TestInput::default()
    });
}

#[test]
fn example_qwik_react_inline() {
	test_input!(TestInput {
        code: r#"
import { componentQrl, inlinedQrl, useLexicalScope, useHostElement, useStore, useTaskQrl, noSerialize, SkipRerender, implicit$FirstArg } from '@builder.io/qwik';
import { jsx, Fragment } from '@builder.io/qwik/jsx-runtime';
import { isBrowser, isServer } from '@builder.io/qwik/build';

function qwikifyQrl(reactCmpQrl) {
    return /*#__PURE__*/ componentQrl(inlinedQrl((props)=>{
        const [reactCmpQrl] = useLexicalScope();
        const hostElement = useHostElement();
        const store = useStore({});
        let run;
        if (props['client:visible']) run = 'visible';
        else if (props['client:load'] || props['client:only']) run = 'load';
        useTaskQrl(inlinedQrl(async (track)=>{
            const [hostElement, props, reactCmpQrl, store] = useLexicalScope();
            track(props);
            if (isBrowser) {
                if (store.data) store.data.root.render(store.data.client.Main(store.data.cmp, filterProps(props)));
                else {
                    const [Cmp, client] = await Promise.all([
                        reactCmpQrl.resolve(),
                        import('./client-f762f78c.js')
                    ]);
                    let root;
                    if (hostElement.childElementCount > 0) root = client.hydrateRoot(hostElement, client.Main(Cmp, filterProps(props), store.event));
                    else {
                        root = client.createRoot(hostElement);
                        root.render(client.Main(Cmp, filterProps(props)));
                    }
                    store.data = noSerialize({
                        client,
                        cmp: Cmp,
                        root
                    });
                }
            }
        }, "qwikifyQrl_component_useWatch_x04JC5xeP1U", [
            hostElement,
            props,
            reactCmpQrl,
            store
        ]), {
            run
        });
        if (isServer && !props['client:only']) {
            const jsx$1 = Promise.all([
                reactCmpQrl.resolve(),
                import('./server-9ac6caad.js')
            ]).then(([Cmp, server])=>{
                const html = server.render(Cmp, filterProps(props));
                return /*#__PURE__*/ jsx(Host, {
                    dangerouslySetInnerHTML: html,
                    [_IMMUTABLE]: [
                        "dangerouslySetInnerHTML"
                    ]
                });
            });
            return /*#__PURE__*/ jsx(Fragment, {
                children: jsx$1
            });
        }
        return /*#__PURE__*/ jsx(Host, {
            children: /*#__PURE__*/ jsx(SkipRerender, {})
        });
    }, "qwikifyQrl_component_zH94hIe0Ick", [
        reactCmpQrl
    ]), {
        tagName: 'qwik-wrap'
    });
}
const filterProps = (props)=>{
    const obj = {};
    Object.keys(props).forEach((key)=>{
        if (!key.startsWith('client:')) obj[key] = props[key];
    });
    return obj;
};
const qwikify$ = implicit$FirstArg(qwikifyQrl);

async function renderToString(rootNode, opts) {
    const mod = await import('./server-9ac6caad.js');
    const result = await mod.renderToString(rootNode, opts);
    const styles = mod.getGlobalStyleTag(result.html);
    const finalHtml = styles + result.html;
    return {
        ...result,
        html: finalHtml
    };
}

export { qwikify$, qwikifyQrl, renderToString };
        "#
        .to_string(),
        filename: "../node_modules/@builder.io/qwik-react/index.qwik.mjs".to_string(),
        entry_strategy: EntryStrategy::Inline,
        explicit_extensions: true,
        ..TestInput::default()
    });
}

#[test]
fn example_qwik_sdk_inline() {
	test_input!(TestInput {
		code: include_str!("fixtures/index.qwik.mjs").to_string(),
		filename: "../node_modules/@builder.io/qwik-city/index.qwik.mjs".to_string(),
		entry_strategy: EntryStrategy::Smart,
		explicit_extensions: true,
		mode: EmitMode::Prod,
		..TestInput::default()
	});
}

#[test]
fn relative_paths() {
	let dep = r#"
import { componentQrl, inlinedQrl, useStore, useLexicalScope } from "@builder.io/qwik";
import { jsx, jsxs } from "@builder.io/qwik/jsx-runtime";
import { state } from './sibling';

const useData = () => {
    return useStore({
        count: 0
    });
}

export const App = /*#__PURE__*/ componentQrl(inlinedQrl(()=>{
    const store = useData();
    return /*#__PURE__*/ jsxs("div", {
        children: [
            /*#__PURE__*/ jsxs("p", {
                children: [
                    "Count: ",
                    store.count
                ]
            }),
            /*#__PURE__*/ jsx("p", {
                children: /*#__PURE__*/ jsx("button", {
                    onClick$: inlinedQrl(()=>{
                        const [store] = useLexicalScope();
                        return store.count++;
                    }, "App_component_div_p_button_onClick_8dWUa0cJAr4", [
                        store
                    ]),
                    children: "Click"
                })
            })
        ]
    });
}, "App_component_AkbU84a8zes"));

"#;
	let code = r#"
import { component$, $ } from '@builder.io/qwik';
import { state } from './sibling';

export const Local = component$(() => {
    return (
        <div>{state}</div>
    )
});
"#;
	let res = transform_modules(TransformModulesOptions {
		src_dir: "/path/to/app/src/thing".into(),
		root_dir: Some("/path/to/app/".into()),
		input: vec![
			TransformModuleInput {
				code: dep.into(),
				path: "../../node_modules/dep/dist/lib.mjs".into(),
			},
			TransformModuleInput {
				code: code.into(),
				path: "components/main.tsx".into(),
			},
		],
		source_maps: true,
		minify: MinifyMode::Simplify,
		explicit_extensions: true,
		mode: EmitMode::Lib,
		manual_chunks: None,
		entry_strategy: EntryStrategy::Hook,
		transpile_ts: true,
		transpile_jsx: true,
		preserve_filenames: false,
		core_module: None,
		scope: None,
		strip_exports: None,
		strip_ctx_name: None,
		strip_event_handlers: false,
		reg_ctx_name: None,
		is_server: None,
	});
	snapshot_res!(&res, "".into());
}
#[test]
fn consistent_hashes() {
	let code = r#"
import { component$, $ } from '@builder.io/qwik';
import mongo from 'mongodb';

export const Greeter = component$(() => {
    // Double count watch
    useServerMount$(async () => {
        await mongo.users();
    });
    return (
        <div>
            <div onClick$={() => {}}/>
            <div onClick$={() => {}}/>
            <div onClick$={() => {}}/>
        </div>
    )
});

"#;
	let options = vec![
		(EmitMode::Lib, EntryStrategy::Hook, true),
		(EmitMode::Lib, EntryStrategy::Single, true),
		(EmitMode::Lib, EntryStrategy::Component, true),
		// (EmitMode::Lib, EntryStrategy::Inline, true),
		(EmitMode::Prod, EntryStrategy::Hook, true),
		(EmitMode::Prod, EntryStrategy::Single, true),
		(EmitMode::Prod, EntryStrategy::Component, true),
		// (EmitMode::Prod, EntryStrategy::Inline, true),
		(EmitMode::Dev, EntryStrategy::Hook, true),
		(EmitMode::Dev, EntryStrategy::Single, true),
		(EmitMode::Dev, EntryStrategy::Component, true),
		// (EmitMode::Dev, EntryStrategy::Inline, true),
		(EmitMode::Lib, EntryStrategy::Hook, false),
		(EmitMode::Lib, EntryStrategy::Single, false),
		(EmitMode::Lib, EntryStrategy::Component, false),
		// (EmitMode::Lib, EntryStrategy::Inline, false),
		(EmitMode::Prod, EntryStrategy::Hook, false),
		(EmitMode::Prod, EntryStrategy::Single, false),
		(EmitMode::Prod, EntryStrategy::Component, false),
		// (EmitMode::Prod, EntryStrategy::Inline, false),
		(EmitMode::Dev, EntryStrategy::Hook, false),
		(EmitMode::Dev, EntryStrategy::Single, false),
		(EmitMode::Dev, EntryStrategy::Component, false),
		// (EmitMode::Dev, EntryStrategy::Inline, false),
	];

	let res = transform_modules(TransformModulesOptions {
		src_dir: "./thing".into(),
		input: vec![
			TransformModuleInput {
				code: code.into(),
				path: "main.tsx".into(),
			},
			TransformModuleInput {
				code: code.into(),
				path: "components/main.tsx".into(),
			},
		],
		source_maps: true,
		minify: MinifyMode::Simplify,
		root_dir: None,
		explicit_extensions: true,
		mode: EmitMode::Lib,
		manual_chunks: None,
		entry_strategy: EntryStrategy::Hook,
		transpile_ts: true,
		transpile_jsx: true,
		preserve_filenames: false,
		scope: None,
		core_module: None,
		reg_ctx_name: None,
		strip_exports: None,
		strip_ctx_name: None,
		strip_event_handlers: false,
		is_server: None,
	});
	let ref_hooks: Vec<_> = res
		.unwrap()
		.modules
		.into_iter()
		.flat_map(|module| module.hook)
		.collect();

	for (i, option) in options.into_iter().enumerate() {
		let res = transform_modules(TransformModulesOptions {
			src_dir: "./thing".into(),
			input: vec![
				TransformModuleInput {
					code: code.into(),
					path: "main.tsx".into(),
				},
				TransformModuleInput {
					code: code.into(),
					path: "components/main.tsx".into(),
				},
			],
			root_dir: None,
			source_maps: false,
			minify: MinifyMode::Simplify,
			explicit_extensions: true,
			mode: option.0,
			manual_chunks: None,
			entry_strategy: option.1,
			transpile_ts: option.2,
			transpile_jsx: option.2,
			preserve_filenames: false,
			scope: None,
			core_module: None,
			strip_exports: None,
			strip_ctx_name: None,
			strip_event_handlers: false,
			reg_ctx_name: None,
			is_server: None,
		});

		let hooks: Vec<_> = res
			.unwrap()
			.modules
			.into_iter()
			.flat_map(|module| module.hook)
			.collect();

		assert_eq!(hooks.len(), ref_hooks.len());

		for (a, b) in hooks.iter().zip(ref_hooks.iter()) {
			assert_eq!(
				get_hash(a.name.as_ref()),
				get_hash(b.name.as_ref()),
				"INDEX: {}\n\n{:#?}\n\n{:#?}\n\n{:#?}\n\n{:#?}",
				i,
				a,
				b,
				hooks,
				ref_hooks
			);
		}
	}
}

#[test]
fn issue_5008() {
	test_input!(TestInput {
		code: r#"
        import { component$, useStore } from "@builder.io/qwik";

        export default component$(() => {
        const store = useStore([{ value: 0 }]);
        return (
            <>
            <button onClick$={() => store[0].value++}>+1</button>
            {store.map(function (v, idx) {
                return <div key={"fn_" + idx}>Function: {v.value}</div>;
            })}
            {store.map((v, idx) => (
                <div key={"arrow_" + idx}>Arrow: {v.value}</div>
            ))}
            </>
        );
        });
        "#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}

#[test]
fn example_of_synchronous_qrl() {
	test_input!(TestInput {
		code: r#"
        import { sync$, component$ } from "@builder.io/qwik";

        export default component$(() => {
        return (
            <>
                <input onClick$={sync$(function(event, target) {
                    // comment should be removed
                    event.preventDefault();
                })}/>
                <input onClick$={sync$((event, target) => {
                    event.preventDefault();
                })}/>
                <input onClick$={sync$((event, target) => event.preventDefault())}/>
            </>
        );
        });
        "#
		.to_string(),
		transpile_ts: true,
		transpile_jsx: true,
		..TestInput::default()
	});
}

// TODO(misko): Make this test work by implementing strict serialization.
// #[test]
// fn example_of_synchronous_qrl_that_cant_be_serialized() {
//     test_input!(TestInput {
//         code: r#"
//         import { sync$, component$ } from "@builder.io/qwik";

//         export default component$(() => {
//         return (
//             <input onClick$={sync$(function(event, target) {
//                 console.log(component$);
//             })}/>
//         );
//         });
//         "#
//         .to_string(),
//         transpile_ts: true,
//         transpile_jsx: true,
//         ..TestInput::default()
//     });
// }

fn get_hash(name: &str) -> String {
	name.split('_').last().unwrap().into()
}

struct TestInput {
	pub code: String,
	pub filename: String,
	pub src_dir: String,
	pub root_dir: Option<String>,
	pub manual_chunks: Option<HashMap<String, JsWord>>,
	pub entry_strategy: EntryStrategy,
	pub minify: MinifyMode,
	pub transpile_ts: bool,
	pub transpile_jsx: bool,
	pub preserve_filenames: bool,
	pub explicit_extensions: bool,
	pub snapshot: bool,
	pub mode: EmitMode,
	pub core_module: Option<String>,
	pub scope: Option<String>,
	pub strip_exports: Option<Vec<String>>,
	pub reg_ctx_name: Option<Vec<String>>,
	pub strip_ctx_name: Option<Vec<String>>,
	pub strip_event_handlers: bool,
	pub is_server: Option<bool>,
}

impl TestInput {
	pub fn default() -> Self {
		Self {
			filename: "test.tsx".to_string(),
			src_dir: "/user/qwik/src/".to_string(),
			root_dir: None,
			code: "/user/qwik/src/".to_string(),
			manual_chunks: None,
			entry_strategy: EntryStrategy::Hook,
			minify: MinifyMode::Simplify,
			transpile_ts: false,
			transpile_jsx: false,
			preserve_filenames: false,
			explicit_extensions: false,
			snapshot: true,
			mode: EmitMode::Lib,
			scope: None,
			core_module: None,
			reg_ctx_name: None,
			strip_exports: None,
			strip_ctx_name: None,
			strip_event_handlers: false,
			is_server: None,
		}
	}
}
