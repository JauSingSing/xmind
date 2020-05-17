<template>
  <div>
    <div class="top-part">
      <el-button type="primary" @click="addBill">添加账单</el-button>
    </div>
    <el-row>
      <el-col :xs="24" :sm="18" :md="18" :lg="18" :xl="18">
        <el-table
          :data="tableData"
          :row-key="setTableRowKey"
          :loading="pending"
          @filter-change="handleFilter"
        >
          <el-table-column
            :filters="monthList"
            label="时间"
            prop="time"
            column-key="time"
            show-overflow-tooltip
            min-width="100"
          ></el-table-column>
          <el-table-column label="类型" prop="type" show-overflow-tooltip min-width="50">
            <template slot-scope="scope">{{ scope.row.type ? '收入' : '支出' }}</template>
          </el-table-column>
          <el-table-column
            :filters="filterCategoryList"
            label="分类"
            prop="category"
            column-key="category"
            min-width="60"
          ></el-table-column>
          <el-table-column
            label="金额(￥)"
            prop="amount"
            show-overflow-tooltip
            align="right"
            min-width="60"
          >
            <template slot-scope="scope">
              <span :class="{ 'income-color': scope.row.type }">{{ scope.row.amount }}</span>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pageQuery.currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageQuery.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pageQuery.total"
          class="pagination"
        ></el-pagination>
        <div class="total">
          <span class="total-item">总收入：{{ totalIncome }}</span>
          <span class="total-item">总支出：{{ totalOutlay }}</span>
        </div>
      </el-col>
      <el-col :xs="24" :sm="6" :md="6" :lg="6" :xl="6">
        <h3>支出统计</h3>
        <ul v-if="summary.length" class="summary-list">
          <li v-for="item in summary" :key="item.id" class="summary-item">
            <span>{{ item.category }}</span>
            <span>{{ item.sum }}</span>
          </li>
        </ul>
        <p v-else class="none-tips">暂无数据</p>
      </el-col>
    </el-row>

    <el-dialog title="添加账单" :visible.sync="isDialogVisible" width="300px" @close="closeDialog">
      <el-form ref="billForm" :rules="billRules" :model="bill" label-width="60px">
        <el-form-item label="日期" prop="time">
          <el-date-picker
            v-model="bill.time"
            type="datetime"
            value-format="timestamp"
            placeholder="选择日期时间"
            class="form-item"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="bill.type" clearable placeholder="请选择账单类型" class="form-item">
            <el-option label="收入" value="1"></el-option>
            <el-option label="支出" value="0"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-select
            v-model="bill.category"
            :disabled="bill.type===''"
            :placeholder="bill.type===''?'请先选择账单类型':'请选择账单的分类'"
            clearable
            class="form-item"
          >
            <el-option
              v-for="item in categoryList.filter(item => item.type == bill.type)"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input v-model="bill.amount" class="form-item"></el-input>
          <p class="little-tips">(保留两位小数)</p>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="submitBill">提交</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import axios from "axios";
import { formatCSV, formatDate, formatNumber } from "@/utils/format";
export default {
  data() {
    return {
      month: "",
      category: "",
      pending: false,
      monthList: [],
      categoryList: [],
      filterCategoryList: [],
      outlayList: [],
      summary: [],
      filtersQuery: {},
      listData: [],
      tableData: [],
      pageQuery: {
        total: 0,
        pageSize: 20,
        currentPage: 1
      },
      totalIncome: 0,
      totalOutlay: 0,
      isDialogVisible: false,
      bill: {
        time: "",
        type: "",
        category: "",
        amount: ""
      },
      billRules: {
        time: [
          {
            type: "date",
            required: true,
            message: "请选择时间",
            trigger: "change"
          }
        ],
        type: [
          {
            required: true,
            message: "请选择类型",
            trigger: "change"
          }
        ],
        amount: [
          {
            required: true,
            trigger: "blur",
            validator: function(rule, value, callback) {
              if (!value) callback(new Error("请输入金额"));
              if (!/^\-?\d+(\.\d+)?$/.test(value)) {
                callback(new Error("金额只能输入数字"));
              }
              callback();
            }
          }
        ]
      }
    };
  },
  created() {
    this.init();
  },
  methods: {
    init() {
      this.getListData();
      this.getMonthList();
      this.getCategoryList();
    },
    async getListData() {
      this.pending = true;
      let [list, summary] = await Promise.all([
        axios.get(
          `api/getBillData?page=${this.pageQuery.currentPage}&perPage=${
            this.pageQuery.pageSize
          }&month=${
            this.filtersQuery.time ? this.filtersQuery.time.join(",") : ""
          }&category=${
            this.filtersQuery.category
              ? this.filtersQuery.category.join(",")
              : ""
          }`
        ),
        axios.get(
          `api/getSummaryData?month=${
            this.filtersQuery.time ? this.filtersQuery.time.join(",") : ""
          }`
        )
      ]);
      if (list.status == 200 && summary.status == 200) {
        this.tableData = list.data.data.map(item => {
          item.time = formatDate(item.time);
          item.category = item.category ? item.category.name : "";
          item.amount = formatNumber(item.amount);
          return item;
        });
        this.pageQuery.total = summary.data.total;
        this.totalIncome = formatNumber(summary.data.totalIncome);
        this.totalOutlay = formatNumber(summary.data.totalOutlay);
        this.summary = summary.data.data.map(item => {
          item.sum = formatNumber(item.sum);
          return item;
        });
      }
      this.pending = false;
    },
    async getMonthList() {
      let response = await axios.get("api/getMonthData");
      if (response.status == 200) {
        this.monthList = response.data.map(month => {
          return { text: parseInt(month.value) + "月", value: month.value };
        });
      }
    },
    async getCategoryList() {
      let response = await axios.get("api/getCategoryData");
      if (response.status == 200) {
        this.filterCategoryList = response.data.map(category => {
          return { text: category.name, value: category._id };
        });
      }
    },
    setTableRowKey(row) {
      return row._id;
    },
    handleSizeChange(size) {
      this.pageQuery.pageSize = size;
      this.getListData();
    },
    handleCurrentChange(page) {
      this.pageQuery.currentPage = page;
      this.getListData();
    },
    async addBill() {
      this.isDialogVisible = true;
      let response = await axios.get("api/getAllCategoryData");
      if (response.status == 200) {
        this.categoryList = response.data;
      }
    },
    submitBill() {
      this.$refs.billForm.validate(async valid => {
        if (!valid) return;
        let response = await axios.post("api/addBillData", this.bill);
        if (response.status == 200) {
          this.$message.success(response.data.message || "添加成功");
        } else {
          this.$message.error(response.data.message || "服务端出错");
        }
        this.closeDialog();
        this.init();
      });
    },
    closeDialog() {
      this.$refs.billForm.resetFields();
      this.isDialogVisible = false;
    },
    handleFilter(filters) {
      Object.assign(this.filtersQuery, filters);
      this.getListData();
    }
  }
};
</script>

<style scoped>
.top-part {
  margin: 5px;
}
.income-color {
  color: #67c23a;
}
/deep/.el-table th .month-selector div {
  height: 28px;
  line-height: 28px;
}
/deep/.el-table .cell {
  white-space: nowrap;
}
.filter-flex--box {
  display: flex;
  padding: 0;
}
.filter-selector {
  min-width: 90px;
  vertical-align: middle;
  margin: 0;
  padding: 0;
}
/deep/.filter-selector input {
  padding: 0 5px;
}
.total {
  float: left;
  font-size: 12px;
  padding: 5px 0;
}
.total-item {
  padding-right: 15px;
}
.pagination {
  float: right;
  padding: 5px 0;
}
.form-item {
  width: 174px;
}
.little-tips {
  font-size: 12px;
}
.container {
  display: flex;
}
.summary-list {
  list-style: none;
  margin: 5px 10px;
}
.summary-item {
  display: flex;
  justify-content: space-between;
  color: rgba(0, 0, 0, 0.65);
  padding: 5px 0;
  align-items: baseline;
}
.summary-item span {
  display: block;
}
.none-tips {
  text-align: center;
  padding: 5px 0;
}
@media (max-width: 1200px) {
  /deep/.el-pagination .el-pagination__sizes,
  /deep/.el-pagination .el-pagination__jump {
    display: none;
  }
}
</style>