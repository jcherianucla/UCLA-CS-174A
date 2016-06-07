#pragma once
#include <map>
#include <utility>

template<class T> struct Callback
{
	void (T::*func)();
	T* operand;

	Callback() : func(NULL), operand(NULL) { }
	Callback( void (T::*func)(), T* operand ) : func(func), operand(operand) { }

	void operator()()	{ ( (*operand) .*func ) (); }
};

template<class T> struct KeyMap
{
	typedef union {
		struct {
		unsigned char key;
		unsigned char mods;
		} mod_key;
      
		short value;
	} ModifiedKey;

	static ModifiedKey modifyKey( unsigned char key, unsigned char mods )
	{
		ModifiedKey mkey;    
		mkey.mod_key.key  = key;
		mkey.mod_key.mods = mods;
		return mkey;
	}

	void addHandler			( unsigned char key, unsigned char mods,		Callback<T> handler , bool overwrite = false )
	{
		assert( !my_map.count( modifyKey( key, mods ).value ) || overwrite );
		my_map[ modifyKey( key, mods ).value ] = handler;
	}

	void removeHandler		( unsigned char key, unsigned char mods )	{	my_map.erase( modifyKey( key, mods ).value );	}
    
	void clearHandlers()	{ my_map.clear();	}

	bool hasHandler			( unsigned char key, unsigned char mods ) const	{	return my_map.count( modifyKey( key, mods ).value ) > 0;	}

	Callback<T> getHandler	( unsigned char key, unsigned char mods ) const	{	return my_map.at( modifyKey( key, mods ).value );	}

	std::map<short, Callback<T> > my_map;
};
