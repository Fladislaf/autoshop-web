const API = {

    async getLatestParts(limit = 12) {
        const { data, error } = await supabaseClient
            .from('parts')
            .select('*')
            .eq('in_stock', true)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) {
            console.error('Ошибка при получении запчастей:', error);
            return [];
        }
        return data;
    },
    async getProductById(id) {

        const { data, error } = await supabaseClient
            .from('parts')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Ошибка базы данных при поиске товара:', error);
            return null;
        }

        return data;
    },
    async getProductFullData(id) {
        const { data: product, error } = await supabaseClient
            .from('parts')
            .select(`
                *,
                part_applicability (
                    generations (
                        id,
                        name,
                        years,
                        body_codes,
                        model_id,
                        models (
                            id,
                            name,
                            brand_id,
                            brands (
                                id,
                                name
                            )
                        )
                    ),
                    engines (
                        id,
                        name
                    )
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Ошибка при получении полных данных:', error);
            return null;
        }
        return product;
    },




    async getBrands() {
        const { data, error } = await supabaseClient
            .from('brands')
            .select('id, name')
            .order('name');

        if (error) { console.error('Ошибка загрузки марок:', error); return []; }
        return data;
    },


    async getModelsByBrand(brandId) {
        const { data, error } = await supabaseClient
            .from('models')
            .select('id, name')
            .eq('brand_id', brandId)
            .order('name');

        if (error) { console.error('Ошибка загрузки моделей:', error); return []; }
        return data;
    },


    async getGenerationsByModel(modelId) {
        const { data, error } = await supabaseClient
            .from('generations')
            .select('id, name, years, body_codes')
            .eq('model_id', modelId)
            .order('name');

        if (error) { console.error('Ошибка загрузки поколений:', error); return []; }
        return data;
    },




    async getCarInfo(makeId, modelId, genId, engineId) {
        let info = { makeName: null, modelName: null, genName: null, engineName: null };

        if (makeId) {
            const { data } = await supabaseClient.from('brands').select('name').eq('id', makeId).single();
            if (data) info.makeName = data.name;
        }
        if (modelId) {
            const { data } = await supabaseClient.from('models').select('name').eq('id', modelId).single();
            if (data) info.modelName = data.name;
        }
        if (genId) {
            const { data } = await supabaseClient.from('generations').select('name, years').eq('id', genId).single();
            if (data) info.genName = `${data.name}${data.years ? ', ' + data.years : ''}`;
        }
        if (engineId) {
            const { data } = await supabaseClient.from('engines').select('name').eq('id', engineId).single();
            if (data) info.engineName = data.name;
        }
        return info;
    },


    async getFilteredParts(makeId, modelId, genId) {

        if (!makeId && !modelId && !genId) {
            const { data, error } = await supabaseClient.from('parts').select('*').limit(100);
            return error ? [] : data;
        }



        let query = supabaseClient.from('parts').select(`
            *,
            part_applicability!inner (
                generations!inner (
                    id,
                    model_id,
                    models!inner (
                        id,
                        brand_id
                    )
                )
            )
        `);


        if (genId) {
            query = query.eq('part_applicability.generations.id', genId);
        } else if (modelId) {
            query = query.eq('part_applicability.generations.models.id', modelId);
        } else if (makeId) {
            query = query.eq('part_applicability.generations.models.brand_id', makeId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Ошибка при фильтрации:', error);
            return [];
        }

        return data;
    },


    async getCategories() {
        const { data, error } = await supabaseClient
            .from('categories')
            .select('id, name')
            .order('name');

        if (error) { console.error('Ошибка загрузки категорий:', error); return []; }
        return data;
    },


    async getAvailableCategoryIds(makeId, modelId, genId, engineId, searchQuery = null) {
        let query = supabaseClient.from('parts').select(`
            category_id,
            part_applicability!inner (
                engine_id,
                generations!inner (id, model_id, models!inner (brand_id))
            )
        `).eq('in_stock', true);





        if (searchQuery) {

            const q = searchQuery.trim();



            query = query.or(`name.plfts(russian).${q},name.ilike.%${q}%,oem_number.ilike.%${q}%,sku.ilike.%${q}%`);
        }

        if (engineId) query = query.eq('part_applicability.engine_id', engineId);
        if (genId) query = query.eq('part_applicability.generations.id', genId);
        else if (modelId) query = query.eq('part_applicability.generations.models.id', modelId);
        else if (makeId) query = query.eq('part_applicability.generations.models.brand_id', makeId);

        const { data, error } = await query;
        if (error) return [];
        return data.map(item => item.category_id);
    },





    async getFilteredParts(makeId, modelId, genId, categoryId, sortOrder = 'cheap', engineId = null, page = 1, limit = 12, searchQuery = null) {
        let query = supabaseClient.from('parts').select(`
            *,
            part_applicability!inner (
                engine_id,
                generations!inner (id, model_id, models!inner (brand_id))
            )
        `);

        query = query.eq('in_stock', true);


        if (searchQuery) {

            const q = searchQuery.trim();


            query = query.or(`name.plfts(russian).${q},name.ilike.%${q}%,oem_number.ilike.%${q}%,sku.ilike.%${q}%`);
        }

        if (engineId) query = query.eq('part_applicability.engine_id', engineId);
        if (genId) query = query.eq('part_applicability.generations.id', genId);
        else if (modelId) query = query.eq('part_applicability.generations.models.id', modelId);
        else if (makeId) query = query.eq('part_applicability.generations.models.brand_id', makeId);

        if (categoryId) query = query.eq('category_id', categoryId);

        if (sortOrder === 'expensive') query = query.order('price', { ascending: false });
        else query = query.order('price', { ascending: true });

        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        const { data, error } = await query;
        if (error) { console.error('Ошибка при фильтрации:', error); return []; }
        return data;
    },

    async getEnginesByGen(genId) {
        if (!genId) return [];


        const { data, error } = await supabaseClient
            .from('part_applicability')
            .select(`
                engines (
                    id, 
                    name
                )
            `)
            .eq('generation_id', genId);

        if (error) {
            console.error('Ошибка загрузки связанных двигателей:', error);
            return [];
        }



        const uniqueEngines = [];
        const seenIds = new Set();

        data.forEach(item => {
            if (item.engines && !seenIds.has(item.engines.id)) {
                uniqueEngines.push(item.engines);
                seenIds.add(item.engines.id);
            }
        });


        return uniqueEngines.sort((a, b) => a.name.localeCompare(b.name));
    },







    async getTires(filters = {}, sortOrder = 'cheap', page = 1, limit = 12) {
        let query = supabaseClient.from('tires').select('*', { count: 'exact' }).eq('in_stock', true);


        if (filters.brands && filters.brands.length > 0) {
            query = query.in('manufacturer', filters.brands);
        }
        if (filters.seasons && filters.seasons.length > 0) {
            query = query.in('tire_season', filters.seasons);
        }
        if (filters.diameters && filters.diameters.length > 0) {
            query = query.in('tire_diameter', filters.diameters);
        }

        if (filters.widths && filters.widths.length > 0) {
            query = query.in('tire_width', filters.widths);
        }
        if (filters.profiles && filters.profiles.length > 0) {
            query = query.in('tire_profile', filters.profiles);
        }
        

        if (filters.searchQuery) {
            const q = filters.searchQuery.trim();
            query = query.or(`name.plfts(russian).${q},name.ilike.%${q}%,sku.ilike.%${q}%,set_number.ilike.%${q}%`);
        }


        if (sortOrder === 'expensive') {
            query = query.order('price', { ascending: false });
        } else {
            query = query.order('price', { ascending: true });
        }


        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;
        if (error) { 
            console.error('Ошибка загрузки шин:', error); 
            return { items: [], totalCount: 0 }; 
        }
        

        return { items: data, totalCount: count };
    },



    async getTireFilters() {

        const { data, error } = await supabaseClient
            .from('tires')
            .select('manufacturer, tire_diameter, tire_width, tire_profile, tire_season')
            .eq('in_stock', true);
            
        if (error) {
            console.error('Ошибка загрузки фильтров:', error);
            return null;
        }


        const getUnique = (arr) => [...new Set(arr)].filter(Boolean);


        return {
            brands: getUnique(data.map(i => i.manufacturer)).sort(),
            diameters: getUnique(data.map(i => i.tire_diameter)).sort(),
            widths: getUnique(data.map(i => i.tire_width)).sort((a, b) => a - b),
            profiles: getUnique(data.map(i => i.tire_profile)).sort((a, b) => a - b),
            seasons: getUnique(data.map(i => i.tire_season)).sort()
        };
    },






    async getWheelFilters() {
        const { data, error } = await supabaseClient
            .from('wheels')
            .select('manufacturer, wheel_diameter, wheel_bolt_pattern, wheel_width, wheel_offset_et, wheel_cb_dia')
            .eq('in_stock', true);
            
        if (error) {
            console.error('Ошибка загрузки фильтров дисков:', error);
            return null;
        }

        const getUnique = (arr) => [...new Set(arr)].filter(Boolean);

        return {
            brands: getUnique(data.map(i => i.manufacturer)).sort(),
            diameters: getUnique(data.map(i => i.wheel_diameter)).sort(),
            boltPatterns: getUnique(data.map(i => i.wheel_bolt_pattern)).sort(),
            widths: getUnique(data.map(i => i.wheel_width)).sort((a, b) => a - b),
            offsets: getUnique(data.map(i => i.wheel_offset_et)).sort((a, b) => a - b),
            dias: getUnique(data.map(i => i.wheel_cb_dia)).sort((a, b) => a - b)
        };
    },


    async getWheels(filters = {}, sortOrder = 'cheap', page = 1, limit = 12) {
        let query = supabaseClient.from('wheels').select('*', { count: 'exact' }).eq('in_stock', true);

        if (filters.brands && filters.brands.length > 0) query = query.in('manufacturer', filters.brands);
        if (filters.diameters && filters.diameters.length > 0) query = query.in('wheel_diameter', filters.diameters);
        if (filters.boltPatterns && filters.boltPatterns.length > 0) query = query.in('wheel_bolt_pattern', filters.boltPatterns);
        if (filters.widths && filters.widths.length > 0) query = query.in('wheel_width', filters.widths);
        if (filters.offsets && filters.offsets.length > 0) query = query.in('wheel_offset_et', filters.offsets);
        if (filters.dias && filters.dias.length > 0) query = query.in('wheel_cb_dia', filters.dias);
        

        if (filters.searchQuery) {
            const q = filters.searchQuery.trim();
            query = query.or(`name.plfts(russian).${q},name.ilike.%${q}%,sku.ilike.%${q}%,set_number.ilike.%${q}%`);
        }


        if (sortOrder === 'expensive') {
            query = query.order('price', { ascending: false });
        } else {
            query = query.order('price', { ascending: true });
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;
        if (error) { 
            console.error('Ошибка загрузки дисков:', error); 
            return { items: [], totalCount: 0 }; 
        }
        
        return { items: data, totalCount: count };
    },


    async getTireById(id) {
        try {
            const { data, error } = await supabaseClient.from('tires').select('*').eq('id', id).single();
            if (error) throw error;
            return data;
        } catch (err) { return null; }
    },
    async updateTire(id, data) {
        try {
            const { error } = await supabaseClient.from('tires').update(data).eq('id', id);
            return !error;
        } catch (err) { return false; }
    },


    async getWheelById(id) {
        try {
            const { data, error } = await supabaseClient.from('wheels').select('*').eq('id', id).single();
            if (error) throw error;
            return data;
        } catch (err) { return null; }
    },
    async updateWheel(id, data) {
        try {
            const { error } = await supabaseClient.from('wheels').update(data).eq('id', id);
            return !error;
        } catch (err) { return false; }
    },


    async createOrder(orderData, cartItems) {
        try {
            const newOrderId = crypto.randomUUID();
            orderData.id = newOrderId;

            const { error: orderError } = await supabaseClient
                .from('orders')
                .insert([orderData]);

            if (orderError) {
                console.error('Ошибка создания заказа (orders):', orderError);
                return { success: false, error: orderError };
            }

            const itemsToInsert = cartItems.map(item => {
                const orderItem = {
                    order_id: newOrderId,
                    product_name: item.name,
                    price: item.price,
                    quantity: item.quantity || 1
                };

                if (item.type === 'part') orderItem.part_id = item.id;
                else if (item.type === 'tire') orderItem.tire_id = item.id;
                else if (item.type === 'wheel') orderItem.wheel_id = item.id;

                return orderItem;
            });

            const { error: itemsError } = await supabaseClient
                .from('order_items')
                .insert(itemsToInsert);

            if (itemsError) {
                console.error('Ошибка сохранения товаров заказа (order_items):', itemsError);
                return { success: false, error: itemsError };
            }

            return { success: true, orderId: newOrderId };
            
        } catch (err) {
            console.error('Непредвиденная ошибка при оформлении:', err);
            return { success: false, error: err };
        }
    },




    async getOrders() {
        try {
            const { data, error } = await supabaseClient
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Ошибка загрузки заказов:', err);
            return [];
        }
    },


    async updateOrderStatus(orderId, newStatus) {
        try {
            const { error } = await supabaseClient
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;
            return true;
        } catch (err) {
            console.error('Ошибка обновления статуса:', err);
            return false;
        }
    },


    async updateOrderTracking(orderId, trackingCode) {
        try {
            const { error } = await supabaseClient
                .from('orders')
                .update({ tracking_code: trackingCode })
                .eq('id', orderId);

            if (error) throw error;
            return true;
        } catch (err) {
            console.error('Ошибка сохранения трек-номера:', err);
            return false;
        }
    },



    async getOrderItems(orderId) {
        try {
            const { data, error } = await supabaseClient
                .from('order_items')

                .select(`
                    *,
                    parts ( sku, name ),
                    tires ( sku, name ),
                    wheels ( sku, name )
                `)
                .eq('order_id', orderId);
            
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Ошибка загрузки состава заказа:', err);
            return [];
        }
    },


    async deleteOrder(id) {
        try {

            await supabaseClient.from('order_items').delete().eq('order_id', id);
            

            const { error } = await supabaseClient.from('orders').delete().eq('id', id);
            return !error;
        } catch (err) {
            console.error('Ошибка удаления заказа:', err);
            return false;
        }
    },




    async getPartsList() {
        try {
            const { data, error } = await supabaseClient
                .from('parts')
                .select('id, name, price, sku, in_stock, categories(name)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Ошибка загрузки запчастей:', err);
            return [];
        }
    },


    async addPart(partData) {
        try {
            const { data, error } = await supabaseClient
                .from('parts')
                .insert([partData])
                .select()
                .single();
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Ошибка добавления запчасти:', err);
            return null;
        }
    },


    async deletePart(id) {
        try {
            const { error } = await supabaseClient
                .from('parts')
                .delete()
                .eq('id', id);
            if (error) throw error;
            return true;
        } catch (err) {
            console.error('Ошибка удаления запчасти:', err);
            return false;
        }
    },


    async addPartApplicability(partId, generationId, engineId = null) {
        try {
            const { error } = await supabaseClient
                .from('part_applicability')
                .insert([{
                    part_id: partId,
                    generation_id: generationId,
                    engine_id: engineId || null
                }]);
            if (error) throw error;
            return true;
        } catch (err) {
            console.error('Ошибка привязки к авто:', err);
            return false;
        }
    },




    async addCategory(name) {
        try {
            const { error } = await supabaseClient.from('categories').insert([{ name }]);
            if (error) throw error;
            return true;
        } catch (err) {
            console.error('Ошибка добавления категории:', err);
            return false;
        }
    },


    async deleteCategory(id) {
        try {
            const { error } = await supabaseClient.from('categories').delete().eq('id', id);
            if (error) throw error;
            return true;
        } catch (err) {
            console.error('Ошибка удаления категории:', err);
            return false;
        }
    },


    async addBrand(name) {
        try {
            const { error } = await supabaseClient.from('brands').insert([{ name }]);
            if (error) throw error;
            return true;
        } catch (err) {
            console.error('Ошибка добавления марки:', err);
            return false;
        }
    },


    async deleteBrand(id) {
        try {
            const { error } = await supabaseClient.from('brands').delete().eq('id', id);
            if (error) throw error;
            return true;
        } catch (err) {
            console.error('Ошибка удаления марки:', err);
            return false;
        }
    },




    async uploadImage(file) {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError, data } = await supabaseClient.storage
                .from('product-images')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }
            
            const { data: { publicUrl } } = supabaseClient.storage
                .from('product-images')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Ошибка загрузки изображения:', error);
            return null;
        }
    },


    async addMultipleApplicabilities(partId, rows) {
        const toInsert = rows.map(row => ({
            part_id: partId,
            generation_id: row.genId || null,
            engine_id: row.engineId || null
        }));






        const validRows = toInsert.filter(r => r.generation_id !== null);

        if (validRows.length === 0) return true;

        const { error } = await supabaseClient
            .from('part_applicability')
            .insert(validRows);
        
        return !error;
    },




    async getPartById(id) {
        try {
            const { data, error } = await supabaseClient
                .from('parts')
                .select(`
                    *,
                    part_applicability (
                        generation_id,
                        engine_id,
                        generations (
                            model_id,
                            models ( brand_id )
                        )
                    )
                `)
                .eq('id', id)
                .single();
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Ошибка получения запчасти:', err);
            return null;
        }
    },


    async updatePart(id, partData) {
        try {
            const { data, error } = await supabaseClient
                .from('parts')
                .update(partData)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Ошибка обновления запчасти:', err);
            return null;
        }
    },


    async clearPartApplicabilities(partId) {
        try {
            const { error } = await supabaseClient
                .from('part_applicability')
                .delete()
                .eq('part_id', partId);
            return !error;
        } catch (err) {
            return false;
        }
    },




    

    async getTiresList() {
        try {
            const { data, error } = await supabaseClient
                .from('tires')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Ошибка загрузки шин:', err);
            return [];
        }
    },


    async addTire(tireData) {
        try {
            const { data, error } = await supabaseClient
                .from('tires')
                .insert([tireData])
                .select()
                .single();
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Ошибка добавления шины:', err);
            return null;
        }
    },


    async deleteTire(id) {
        try {
            const { error } = await supabaseClient.from('tires').delete().eq('id', id);
            if (error) throw error;
            return true;
        } catch (err) {
            console.error('Ошибка удаления шины:', err);
            return false;
        }
    },






    async getWheelsList() {
        try {
            const { data, error } = await supabaseClient
                .from('wheels')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Ошибка загрузки дисков:', err);
            return [];
        }
    },


    async addWheel(wheelData) {
        try {
            const { data, error } = await supabaseClient
                .from('wheels')
                .insert([wheelData])
                .select()
                .single();
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Ошибка добавления диска:', err);
            return null;
        }
    },


    async deleteWheel(id) {
        try {
            const { error } = await supabaseClient.from('wheels').delete().eq('id', id);
            if (error) throw error;
            return true;
        } catch (err) {
            console.error('Ошибка удаления диска:', err);
            return false;
        }
    },






    async getAllModels() {
        try {

            const { data, error } = await supabaseClient
                .from('models')
                .select('*, brands(name)')
                .order('name');
            if (error) throw error;
            return data;
        } catch (err) { console.error('Ошибка моделей:', err); return []; }
    },
    async addModelToDb(data) {
        try {
            const { error } = await supabaseClient.from('models').insert([data]);
            return !error;
        } catch (err) { return false; }
    },
    async deleteModel(id) {
        try {
            const { error } = await supabaseClient.from('models').delete().eq('id', id);
            return !error;
        } catch (err) { return false; }
    },


    async getAllGenerations() {
        try {

            const { data, error } = await supabaseClient
                .from('generations')
                .select('*, models(name, brands(name))')
                .order('name');
            if (error) throw error;
            return data;
        } catch (err) { console.error('Ошибка поколений:', err); return []; }
    },
    async addGenerationToDb(data) {
        try {
            const { error } = await supabaseClient.from('generations').insert([data]);
            return !error;
        } catch (err) { return false; }
    },
    async deleteGeneration(id) {
        try {
            const { error } = await supabaseClient.from('generations').delete().eq('id', id);
            return !error;
        } catch (err) { return false; }
    },


    async getAllEngines() {
        try {
            const { data, error } = await supabaseClient
                .from('engines')
                .select('*')
                .order('name');
            if (error) throw error;
            return data;
        } catch (err) { console.error('Ошибка двигателей:', err); return []; }
    },
    async addEngineToDb(data) {
        try {
            const { error } = await supabaseClient.from('engines').insert([data]);
            return !error;
        } catch (err) { return false; }
    },
    async deleteEngine(id) {
        try {
            const { error } = await supabaseClient.from('engines').delete().eq('id', id);
            return !error;
        } catch (err) { return false; }
    },




    

    async login(email, password) {
        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });
            if (error) throw error;
            return { success: true, user: data.user };
        } catch (err) {
            console.error('Ошибка входа:', err.message);
            return { success: false, error: err.message };
        }
    },


    async logout() {
        const { error } = await supabaseClient.auth.signOut();
        return !error;
    },


    async checkAuth() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        return session !== null;
    }
};
